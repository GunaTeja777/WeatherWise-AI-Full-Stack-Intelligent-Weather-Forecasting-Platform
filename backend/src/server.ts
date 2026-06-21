import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initRedis, getCache, setCache } from './redis';
import { getWeatherData, getHistoricalWeatherData } from './weather';
import axios from 'axios';
import PDFDocument from 'pdfkit';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Create HistoricalQuery table if not exists in PostgreSQL
async function setupDatabase() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HistoricalQuery" (
        "id" SERIAL PRIMARY KEY,
        "city" VARCHAR(255) NOT NULL,
        "startDate" VARCHAR(255) NOT NULL,
        "endDate" VARCHAR(255) NOT NULL,
        "results" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Database] Setup check complete. "HistoricalQuery" table is ready.');
  } catch (err: any) {
    console.error('[Database] Warning: Setup check failed or table already exists:', err.message);
  }
}
setupDatabase();

app.use(cors());
app.use(express.json());

// Initialize Redis caching
initRedis();

// API Root Status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'WeatherMind AI Platform Backend is online.' });
});

// 1. GET /api/weather
app.get('/api/weather', async (req: Request, res: Response): Promise<void> => {
  const city = req.query.city as string;
  if (!city) {
    res.status(400).json({ error: 'City query parameter is required' });
    return;
  }

  const cacheKey = `weather:${city.toLowerCase().trim()}`;
  
  try {
    // Check cache first
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[Cache] Served weather data for: ${city}`);
      res.json(cachedData);
      return;
    }

    // Cache miss, fetch live OWM + Open-Meteo + Gemini data
    console.log(`[Cache Miss] Fetching weather data for: ${city}`);
    const weatherData = await getWeatherData(city);
    
    // Save to cache (TTL: 30 minutes = 1800 seconds)
    await setCache(cacheKey, weatherData, 1800);
    
    res.json(weatherData);
  } catch (error: any) {
    console.error(`Error in /api/weather:`, error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch weather information' });
  }
});

// GET /api/weather/reverse (Reverse geocoding from lat/lon to city name)
app.get('/api/weather/reverse', async (req: Request, res: Response): Promise<void> => {
  const lat = req.query.lat as string;
  const lon = req.query.lon as string;
  const OWM_KEY = process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHERMAP_API_KEY;

  if (!lat || !lon) {
    res.status(400).json({ error: 'Latitude and longitude are required' });
    return;
  }

  if (!OWM_KEY) {
    res.status(503).json({ error: 'OpenWeatherMap API Key missing on backend' });
    return;
  }

  try {
    const reverseGeoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OWM_KEY}`;
    const response = await axios.get(reverseGeoUrl);
    if (response.data && response.data.length > 0) {
      res.json({ city: response.data[0].name });
      return;
    }
  } catch (error: any) {
    console.warn('OWM reverse geocoding failed:', error.message);
  }

  // Fallback to Nominatim reverse geocoding
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
    const response = await axios.get(nominatimUrl, {
      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' }
    });
    if (response.data && response.data.address) {
      const addr = response.data.address;
      const city = addr.city || addr.town || addr.village || addr.suburb || `${lat}, ${lon}`;
      res.json({ city });
      return;
    }
  } catch (error: any) {
    console.error('Nominatim reverse geocoding fallback failed:', error.message);
  }

  res.status(404).json({ error: 'No city found for these coordinates' });
});

// GET /api/weather/history (Date range query)
app.get('/api/weather/history', async (req: Request, res: Response): Promise<void> => {
  const city = req.query.city as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  if (!city || !startDate || !endDate) {
    res.status(400).json({ error: 'City, startDate, and endDate query parameters are required' });
    return;
  }

  // Basic validation
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  const minDate = new Date('1940-01-01');

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: 'Invalid date formats. Use YYYY-MM-DD' });
    return;
  }

  if (start < minDate) {
    res.status(400).json({ error: 'Start date cannot be before 1940-01-01' });
    return;
  }

  if (start > end) {
    res.status(400).json({ error: 'Start date must be before or equal to End date' });
    return;
  }

  if (end > today) {
    res.status(400).json({ error: 'End date cannot be in the future for historical queries' });
    return;
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 90) {
    res.status(400).json({ error: 'Date range cannot exceed 90 days for historical lookup' });
    return;
  }

  const cacheKey = `history:${city.toLowerCase().trim()}:${startDate}:${endDate}`;

  try {
    // Check cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    const data = await getHistoricalWeatherData(city, startDate, endDate);
    await setCache(cacheKey, data, 86400); // Cache historical data for 1 day

    // Save to PostgreSQL Database
    try {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "HistoricalQuery" ("city", "startDate", "endDate", "results") VALUES ($1, $2, $3, $4)',
        city,
        startDate,
        endDate,
        JSON.stringify(data)
      );
      console.log(`[Database] Stored historical weather query for: ${city}`);
    } catch (dbErr: any) {
      console.error('[Database] Failed to store historical query in DB:', dbErr.message);
    }

    res.json(data);
  } catch (error: any) {
    console.error(`Error in /api/weather/history:`, error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch historical weather' });
  }
});

// GET /api/weather/history/recent (Get recently queried weather ranges from DB)
app.get('/api/weather/history/recent', async (req: Request, res: Response) => {
  try {
    const queries: any = await prisma.$queryRawUnsafe(
      'SELECT * FROM "HistoricalQuery" ORDER BY "createdAt" DESC LIMIT 10'
    );
    const parsedQueries = queries.map((q: any) => ({
      ...q,
      id: q.id.toString(),
      results: JSON.parse(q.results)
    }));
    res.json(parsedQueries);
  } catch (error: any) {
    console.error(`Error fetching recent historical queries:`, error.message);
    res.status(500).json({ error: 'Failed to load historical queries from database' });
  }
});

// PUT /api/weather/history/:id (CRUD - Update)
app.put('/api/weather/history/:id', async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid query ID format' });
    return;
  }

  const { city, startDate, endDate, results } = req.body;

  try {
    const existing: any[] = await prisma.$queryRawUnsafe(
      'SELECT * FROM "HistoricalQuery" WHERE "id" = $1',
      id
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Historical query not found' });
      return;
    }
    const current = existing[0];
    const newCity = city !== undefined ? city : current.city;
    const newStartDate = startDate !== undefined ? startDate : current.startDate;
    const newEndDate = endDate !== undefined ? endDate : current.endDate;
    const newResults = results !== undefined ? JSON.stringify(results) : current.results;

    await prisma.$executeRawUnsafe(
      'UPDATE "HistoricalQuery" SET "city" = $1, "startDate" = $2, "endDate" = $3, "results" = $4 WHERE "id" = $5',
      newCity,
      newStartDate,
      newEndDate,
      newResults,
      id
    );

    res.json({
      id: id.toString(),
      city: newCity,
      startDate: newStartDate,
      endDate: newEndDate,
      results: JSON.parse(newResults)
    });
  } catch (error: any) {
    console.error(`Error updating historical query:`, error.message);
    res.status(500).json({ error: 'Failed to update historical query' });
  }
});

// DELETE /api/weather/history/:id (CRUD - Delete)
app.delete('/api/weather/history/:id', async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid query ID format' });
    return;
  }

  try {
    const existing: any[] = await prisma.$queryRawUnsafe(
      'SELECT * FROM "HistoricalQuery" WHERE "id" = $1',
      id
    );
    if (existing.length === 0) {
      res.status(404).json({ error: 'Historical query not found' });
      return;
    }

    await prisma.$executeRawUnsafe(
      'DELETE FROM "HistoricalQuery" WHERE "id" = $1',
      id
    );
    res.json({ success: true, message: `Historical query ${id} successfully deleted` });
  } catch (error: any) {
    console.error(`Error deleting historical query:`, error.message);
    res.status(500).json({ error: 'Failed to delete historical query' });
  }
});

// GET /api/trips/export/pdf (Export itinerary to PDF using pdfkit)
app.get('/api/trips/export/pdf', async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    let buffers: any[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=weathermind_trips.pdf',
        'Content-Length': pdfData.length
      });
      res.end(pdfData);
    });

    // Header section
    doc.fontSize(26).fillColor('#0E1620').text('🌤️ WeatherMind AI', { align: 'center' });
    doc.fontSize(13).fillColor('#C98C4A').text('Personal Travel Itinerary & Intelligence', { align: 'center' });
    doc.moveDown(1.5);
    
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    doc.fontSize(9).fillColor('#6B7280').text(`Exported on: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(1.5);

    if (trips.length === 0) {
      doc.fontSize(12).fillColor('#4B5563').text('No saved trips found in your itinerary.', { align: 'center' });
    } else {
      trips.forEach((trip: any, index: number) => {
        doc.fontSize(15).fillColor('#0E1620').text(`${index + 1}. ${trip.city}, ${trip.country}`, { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor('#374151').text(`Dates: ${trip.dates}`);
        doc.text(`Temperature Snapshot: ${trip.tempSnapshot}`);
        doc.text(`Outlook: ${trip.info}`);
        doc.moveDown();
        
        doc.strokeColor('#F3F4F6').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      });
    }

    doc.end();
  } catch (error: any) {
    console.error(`Error exporting PDF:`, error.message);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

// GET /api/trips/export/json (Export itinerary to JSON)
app.get('/api/trips/export/json', async (req: Request, res: Response): Promise<void> => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    const jsonData = JSON.stringify(trips, null, 2);
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename=weathermind_trips.json',
      'Content-Length': Buffer.byteLength(jsonData)
    });
    res.end(jsonData);
  } catch (error: any) {
    console.error(`Error exporting JSON:`, error.message);
    res.status(500).json({ error: 'Failed to generate JSON export' });
  }
});

// GET /api/trips/export/csv (Export itinerary to CSV)
app.get('/api/trips/export/csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Helper to escape CSV fields
    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = typeof val === 'string' ? val : String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    };

    const headers = ['ID', 'City', 'Country', 'Dates', 'Temperature Snapshot', 'Info', 'Created At'];
    const rows = trips.map(t => [
      t.id,
      t.city,
      t.country,
      t.dates,
      t.tempSnapshot,
      t.info,
      t.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=weathermind_trips.csv',
      'Content-Length': Buffer.byteLength(csvContent)
    });
    res.end(csvContent);
  } catch (error: any) {
    console.error(`Error exporting CSV:`, error.message);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

// 2. GET /api/trips (CRUD - Read)
app.get('/api/trips', async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Return trips mapped to match frontend string IDs
    const formattedTrips = trips.map((trip: any) => ({
      ...trip,
      id: trip.id.toString()
    }));
    res.json(formattedTrips);
  } catch (error: any) {
    console.error(`Error fetching trips:`, error.message);
    res.status(500).json({ error: 'Failed to load trips from database' });
  }
});

// 3. POST /api/trips (CRUD - Create)
app.post('/api/trips', async (req: Request, res: Response): Promise<void> => {
  const { city, country, dates, tempSnapshot, info, gradient } = req.body;
  if (!city || !country || !dates) {
    res.status(400).json({ error: 'City, country, and dates are required' });
    return;
  }

  try {
    const newTrip = await prisma.trip.create({
      data: {
        city,
        country,
        dates,
        tempSnapshot: tempSnapshot || '—',
        info: info || 'No details',
        gradient: gradient || 'linear-gradient(160deg,#5C87A8,#2E4863)'
      }
    });
    res.status(201).json({
      ...newTrip,
      id: newTrip.id.toString()
    });
  } catch (error: any) {
    console.error(`Error creating trip:`, error.message);
    res.status(500).json({ error: 'Failed to save new trip' });
  }
});

// 4. PUT /api/trips/:id (CRUD - Update)
app.put('/api/trips/:id', async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid trip ID format' });
    return;
  }

  const { city, country, dates, tempSnapshot, info, gradient } = req.body;

  try {
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        ...(city && { city }),
        ...(country && { country }),
        ...(dates && { dates }),
        ...(tempSnapshot && { tempSnapshot }),
        ...(info && { info }),
        ...(gradient && { gradient })
      }
    });
    res.json({
      ...updatedTrip,
      id: updatedTrip.id.toString()
    });
  } catch (error: any) {
    console.error(`Error updating trip:`, error.message);
    res.status(500).json({ error: 'Failed to update trip details' });
  }
});

// 5. DELETE /api/trips/:id (CRUD - Delete)
app.delete('/api/trips/:id', async (req: Request, res: Response): Promise<void> => {
  const idStr = req.params.id;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid trip ID format' });
    return;
  }

  try {
    await prisma.trip.delete({
      where: { id }
    });
    res.json({ success: true, message: `Trip ${id} successfully deleted` });
  } catch (error: any) {
    console.error(`Error deleting trip:`, error.message);
    res.status(500).json({ error: 'Failed to delete trip from database' });
  }
});

// 6. GET /api/youtube (Enrichment API)
app.get('/api/youtube', async (req: Request, res: Response) => {
  const query = req.query.query as string;
  const YT_KEY = process.env.YOUTUBE_API_KEY;

  if (!query) {
    res.status(400).json({ error: 'Query parameter is required' });
    return;
  }

  const cacheKey = `yt:${query.toLowerCase().trim()}`;
  
  try {
    const cachedYt = await getCache(cacheKey);
    if (cachedYt) {
      res.json(cachedYt);
      return;
    }

    if (!YT_KEY) {
      // Return static high-quality mock videos related to travel
      const fallbackVideos = [
        { title: `Ultimate ${query} Travel Guide`, videoId: "dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=360&h=200&fit=crop" },
        { title: `Top 10 Things to do in ${query}`, videoId: "dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=360&h=200&fit=crop" },
        { title: `Exploring ${query} like a Local`, videoId: "dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=360&h=200&fit=crop" }
      ];
      res.json(fallbackVideos);
      return;
    }

    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' travel guide')}&key=${YT_KEY}&maxResults=3&type=video`;
    const response = await axios.get(ytUrl);
    
    const videos = response.data.items.map((item: any) => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.high.url
    }));

    await setCache(cacheKey, videos, 86400); // cache for 1 day
    res.json(videos);
  } catch (error: any) {
    console.error(`Error fetching YouTube guides:`, error.message);
    res.json([
      { title: `Travel Guide to ${query}`, videoId: "dQw4w9WgXcQ", thumbnail: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=360&h=200&fit=crop" }
    ]);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`[Server] WeatherWise-AI Backend listening at http://localhost:${port}`);
});
