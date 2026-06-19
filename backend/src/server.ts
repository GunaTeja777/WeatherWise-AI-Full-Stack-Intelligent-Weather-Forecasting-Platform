import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initRedis, getCache, setCache } from './redis';
import { getWeatherData, getHistoricalWeatherData } from './weather';
import axios from 'axios';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

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

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: 'Invalid date formats. Use YYYY-MM-DD' });
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
    res.json(data);
  } catch (error: any) {
    console.error(`Error in /api/weather/history:`, error.message);
    const status = error.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: error.message || 'Failed to fetch historical weather' });
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
