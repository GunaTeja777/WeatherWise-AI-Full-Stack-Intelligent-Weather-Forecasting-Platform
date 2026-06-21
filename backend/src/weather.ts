import axios from 'axios';
import { generateAIAssistance } from './gemini';
import { getCache, setCache } from './redis';

// Helper to parse coordinates from a string query
function parseCoordinates(query: string): { lat: number; lon: number } | null {
  const q = query.trim();
  
  // 1. Simple decimal format: "40.7128, -74.0060" or "40.7128 -74.0060"
  const decimalRegex = /^\s*([-+]?\d+(?:\.\d+)?)\s*[\s,]\s*([-+]?\d+(?:\.\d+)?)\s*$/;
  const decMatch = q.match(decimalRegex);
  if (decMatch) {
    const lat = parseFloat(decMatch[1]);
    const lon = parseFloat(decMatch[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // 2. Clear prefixes or degrees: "40.7128° N, 74.0060° W"
  const cleaned = q.replace(/(?:lat(?:itude)?|lon(?:gitude)?|coords?|deg):?/gi, '').trim();
  
  const dirRegex = /^\s*(\d+(?:\.\d+)?)\s*°?\s*([NS])\s*[\s,]\s*(\d+(?:\.\d+)?)\s*°?\s*([EW])\s*$/i;
  const dirMatch = cleaned.match(dirRegex);
  if (dirMatch) {
    let lat = parseFloat(dirMatch[1]);
    const latDir = dirMatch[2].toUpperCase();
    let lon = parseFloat(dirMatch[3]);
    const lonDir = dirMatch[4].toUpperCase();
    
    if (latDir === 'S') lat = -lat;
    if (lonDir === 'W') lon = -lon;
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  const dirRegex2 = /^\s*([NS])\s*(\d+(?:\.\d+)?)\s*°?\s*[\s,]\s*([EW])\s*(\d+(?:\.\d+)?)\s*°?\s*$/i;
  const dirMatch2 = cleaned.match(dirRegex2);
  if (dirMatch2) {
    const latDir = dirMatch2[1].toUpperCase();
    let lat = parseFloat(dirMatch2[2]);
    const lonDir = dirMatch2[3].toUpperCase();
    let lon = parseFloat(dirMatch2[4]);
    
    if (latDir === 'S') lat = -lat;
    if (lonDir === 'W') lon = -lon;
    
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

// Unified location resolver that handles Cities, Towns, Zip/Postal Codes, GPS Coordinates, and Landmarks.
export async function resolveLocation(
  query: string,
  owmKey: string
): Promise<{ name: string; lat: number; lon: number; country: string }> {
  const trimmed = query.trim();

  // 1. Check if the query is a GPS Coordinate
  const coords = parseCoordinates(trimmed);
  if (coords) {
    console.log(`[Geocode] Query matched GPS coordinates: lat=${coords.lat}, lon=${coords.lon}`);
    
    // Reverse geocode to get a clean name
    try {
      const reverseUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${coords.lat}&lon=${coords.lon}&limit=1&appid=${owmKey}`;
      const res = await axios.get(reverseUrl, { timeout: 2000 });
      if (res.data && res.data.length > 0) {
        const item = res.data[0];
        return {
          name: item.name,
          lat: coords.lat,
          lon: coords.lon,
          country: item.country || 'GPS'
        };
      }
    } catch (err: any) {
      console.warn(`[Geocode] OWM Reverse geocoding failed:`, err.message);
    }

    // Try Nominatim reverse geocoding as fallback for coordinates
    try {
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lon}&format=json`;
      const res = await axios.get(reverseUrl, {
        headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
        timeout: 2000
      });
      if (res.data && res.data.address) {
        const addr = res.data.address;
        const name = addr.tourism || addr.attraction || addr.landmark || addr.amenity || addr.historic ||
                     addr.city || addr.town || addr.village || addr.suburb || `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
        const country = addr.country || addr.country_code?.toUpperCase() || 'GPS';
        return { name, lat: coords.lat, lon: coords.lon, country };
      }
    } catch (err: any) {
      console.warn(`[Geocode] Nominatim Reverse geocoding failed:`, err.message);
    }

    // Default to the coordinates themselves
    return {
      name: `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`,
      lat: coords.lat,
      lon: coords.lon,
      country: 'GPS'
    };
  }

  // 2. Try OpenWeatherMap Geocoding API first (very fast and matches standard queries)
  try {
    console.log(`[Geocode] Attempting OpenWeatherMap direct geocoding for: "${trimmed}"`);
    const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(trimmed)}&limit=1&appid=${owmKey}`;
    const res = await axios.get(geoUrl, { timeout: 1500 });
    
    if (res.data && res.data.length > 0) {
      const item = res.data[0];
      console.log(`[Geocode] OpenWeatherMap resolved to: ${item.name}, ${item.country} (${item.lat}, ${item.lon})`);
      return {
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        country: item.country
      };
    }
  } catch (err: any) {
    console.warn(`[Geocode] OpenWeatherMap direct geocoding first attempt failed:`, err.message);
  }

  // 3. Try Nominatim Geocoding API (Supports Landmarks, Zip codes, Towns, Cities, etc.)
  try {
    console.log(`[Geocode] Attempting Nominatim geocoding fallback for: "${trimmed}"`);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&addressdetails=1`;
    const res = await axios.get(nominatimUrl, {
      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
      timeout: 2000
    });

    if (res.data && res.data.length > 0) {
      const item = res.data[0];
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const addr = item.address || {};

      let name = addr.tourism || addr.attraction || addr.landmark || addr.amenity || addr.historic ||
                 addr.city || addr.town || addr.village || addr.suburb || item.name || trimmed;

      // Enrich name if it is a landmark/zip code
      if (addr.tourism || addr.attraction || addr.landmark || addr.amenity || addr.historic) {
        const cityOrTown = addr.city || addr.town || addr.village || '';
        if (cityOrTown) {
          name = `${name}, ${cityOrTown}`;
        }
      } else if (addr.postcode && addr.postcode.toLowerCase() === trimmed.toLowerCase()) {
        const cityOrTown = addr.city || addr.town || addr.village || addr.state || '';
        if (cityOrTown) {
          name = `${addr.postcode} (${cityOrTown})`;
        }
      }

      const country = addr.country || addr.country_code?.toUpperCase() || 'Unknown';
      console.log(`[Geocode] Nominatim resolved to: ${name}, ${country} (${lat}, ${lon})`);
      return { name, lat, lon, country };
    }
  } catch (err: any) {
    console.warn(`[Geocode] Nominatim search failed or timed out:`, err.message);
  }

  // 4. Try Open-Meteo Geocoding API as fallback (Fast and free fallback for cities, towns, and zip codes)
  try {
    console.log(`[Geocode] Attempting Open-Meteo geocoding fallback for: "${trimmed}"`);
    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=1&language=en&format=json`;
    const res = await axios.get(openMeteoUrl, { timeout: 1500 });
    
    if (res.data && res.data.results && res.data.results.length > 0) {
      const item = res.data.results[0];
      const lat = item.latitude;
      const lon = item.longitude;
      const name = item.name + (item.admin1 ? `, ${item.admin1}` : '');
      const country = item.country || 'Unknown';
      console.log(`[Geocode] Open-Meteo resolved to: ${name}, ${country} (${lat}, ${lon})`);
      return { name, lat, lon, country };
    }
  } catch (err: any) {
    console.warn(`[Geocode] Open-Meteo search failed or timed out:`, err.message);
  }

  throw new Error(`Location "${trimmed}" not found.`);
}


export interface CityData {
  city: string;
  country: string;
  condition: string;
  temp: number;
  feelsLike: number;
  high: number;
  low: number;
  wind: string;
  humidity: number;
  uvIndex: number;
  sunset: string;
  timeZone: string;
  timeZoneLabel: string;
  advisory: string;
  skyType: "haze" | "overcast" | "rain" | "heavy-rain" | "clear";
  forecast: {
    day: string;
    tempHigh: number;
    tempLow: number;
    condition: string;
    skyType: "sun" | "cloud" | "rain" | "heavy-rain" | "clear";
    hasMiniRain?: boolean;
  }[];
  packingNote: string;
  healthNote: string;
  places: {
    name: string;
    image: string;
    desc: string;
  }[];
  isAiPlaceholder?: boolean;
}
const DEFAULT_PLACES: any[] = [];

const CATEGORY_IMAGES: Record<string, string> = {};

const wikiImageCache = new Map<string, string>();

// Helper to generate deterministic weather if API keys are missing (or as fallback)
export function generateFallbackCityData(cityKey: string): CityData {
  const normKey = cityKey.toLowerCase().trim();
  
  // Deterministic generator based on city name characters
  let seed = 0;
  for (let i = 0; i < normKey.length; i++) seed += normKey.charCodeAt(i);
  
  const tempBase = 12 + (seed % 20); // 12 to 32
  const skyTypes: ("haze" | "overcast" | "rain" | "heavy-rain" | "clear")[] = ["clear", "haze", "overcast", "rain", "heavy-rain"];
  const skyType = skyTypes[seed % skyTypes.length];
  
  const conditions = {
    clear: "Sunny and clear skies with gentle breeze",
    haze: "Light haze and warm humidity",
    overcast: "Thick cloud cover, cool and windless",
    rain: "Intermittent showers, light rain",
    "heavy-rain": "Continuous downpour, wet and gusty winds"
  };

  const condition = conditions[skyType];
  const formattedCity = normKey.charAt(0).toUpperCase() + normKey.slice(1);
  
  const forecastSkyTypes: ("sun" | "cloud" | "rain" | "heavy-rain" | "clear")[] = ["clear", "sun", "cloud", "rain", "heavy-rain"];
  const days = ["Today", "Thu", "Fri", "Sat", "Sun"];
  
  const forecast = days.map((day, idx) => {
    const daySeed = seed + idx;
    const fSky = forecastSkyTypes[daySeed % forecastSkyTypes.length];
    const diff = (daySeed % 6) - 3; // -3 to +2
    const high = tempBase + diff + 2;
    const low = tempBase + diff - 4;
    
    const fConditions = {
      sun: "Partly cloudy",
      cloud: "Overcast",
      rain: "Passing showers",
      "heavy-rain": "Heavy storms",
      clear: "Mainly sunny"
    };

    return {
      day,
      tempHigh: Math.round(high),
      tempLow: Math.round(low),
      condition: fConditions[fSky],
      skyType: fSky,
      hasMiniRain: fSky === "rain" || fSky === "heavy-rain"
    };
  });

  const places = DEFAULT_PLACES;

  return {
    city: formattedCity,
    country: seed % 2 === 0 ? "Europe" : "Asia",
    condition,
    temp: tempBase,
    feelsLike: tempBase + (skyType === "clear" ? 2 : -2),
    high: tempBase + 3,
    low: tempBase - 4,
    wind: `${10 + (seed % 15)} km/h NE`,
    humidity: 50 + (seed % 40),
    uvIndex: skyType === "clear" ? 8 : 3,
    sunset: "19:55",
    timeZone: "UTC",
    timeZoneLabel: "UTC",
    advisory: `Typical weather is forecast for ${formattedCity}. Historical 5-year averages indicate stable conditions around ${tempBase}°C.`,
    skyType,
    forecast,
    packingNote: `Bring comfortable layers. For ${condition.toLowerCase()} weather, we recommend checking forecast daily and carrying a jacket.`,
    healthNote: "AQI is excellent. No public health warnings are in place. Perfect for outdoor sightseeing.",
    places
  };
}

// Main function to fetch full weather data
export async function getWeatherData(cityName: string, skipAI: boolean = false): Promise<CityData> {
  const OWM_KEY = process.env.OPENWEATHERMAP_API_KEY;
  if (!OWM_KEY) {
    console.log(`[Weather] OWM key missing. Generating fallback data for: ${cityName}`);
    return generateFallbackCityData(cityName);
  }

  try {
    // 1. Unified geocoding resolution
    const { name, lat, lon, country } = await resolveLocation(cityName, OWM_KEY);

    // 2. Prepare API endpoints
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`;
    const aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;

    const today = new Date();
    const endOffset = new Date();
    endOffset.setDate(today.getDate() + 5);
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Fetch a single consolidated historical archive range from Open-Meteo (from 5 years ago to 1 year ago)
    const histStart = new Date(today);
    histStart.setFullYear(today.getFullYear() - 5);
    const histEnd = new Date(endOffset);
    histEnd.setFullYear(endOffset.getFullYear() - 1);

    const openMeteoUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDate(histStart)}&end_date=${formatDate(histEnd)}&daily=rain_sum&timezone=auto`;

    // 3. Launch OWM Forecast, OWM AQI, and consolidated Open-Meteo requests concurrently!
    const [forecastResponse, aqiResponse, histResponse] = await Promise.all([
      axios.get(forecastUrl),
      axios.get(aqiUrl).catch(() => null), // Gracefully handle if AQI call fails
      axios.get(openMeteoUrl).catch((err) => {
        console.warn('[Historical API] Open-Meteo historical call failed:', err.message);
        return null;
      })
    ]);

    // 4. Process Air Pollution (AQI)
    let aqiText = "Good";
    let aqiValue = 45;
    if (aqiResponse && aqiResponse.data && aqiResponse.data.list && aqiResponse.data.list.length > 0) {
      try {
        const level = aqiResponse.data.list[0].main.aqi; // 1 to 5
        const mapAQI = [
          { label: "Good", val: 20 },
          { label: "Fair", val: 45 },
          { label: "Moderate", val: 75 },
          { label: "Poor", val: 120 },
          { label: "Very Poor", val: 180 }
        ];
        const match = mapAQI[level - 1] || mapAQI[0];
        aqiText = match.label;
        aqiValue = match.val;
      } catch {
        // ignore
      }
    }

    // 5. Process 5-year historical average precipitation (Open-Meteo)
    let historicalDataSummary = "Historical average rain for this period is around 10mm.";
    let percentWetter = 0;
    try {
      const forecastRainSum = forecastResponse.data.list
        .slice(0, 40) // 5 days
        .reduce((sum: number, item: any) => sum + (item.rain ? (item.rain['3h'] || 0) : 0), 0);

      let totalHistoricalRain = 0;
      let countYears = 0;

      if (histResponse && histResponse.data && histResponse.data.daily && histResponse.data.daily.time && histResponse.data.daily.rain_sum) {
        const daily = histResponse.data.daily;
        
        for (let offsetYears = 1; offsetYears <= 5; offsetYears++) {
          const targetStart = new Date(today);
          targetStart.setFullYear(today.getFullYear() - offsetYears);
          const targetEnd = new Date(endOffset);
          targetEnd.setFullYear(endOffset.getFullYear() - offsetYears);
          
          const targetStartStr = formatDate(targetStart);
          const targetEndStr = formatDate(targetEnd);

          const startIndex = daily.time.indexOf(targetStartStr);
          const endIndex = daily.time.indexOf(targetEndStr);

          if (startIndex !== -1 && endIndex !== -1) {
            const yearSum = daily.rain_sum
              .slice(startIndex, endIndex + 1)
              .reduce((a: number, b: number) => a + (b || 0), 0);
            
            totalHistoricalRain += yearSum;
            countYears++;
          }
        }
      }

      const avgHistRain = countYears > 0 ? (totalHistoricalRain / countYears) : 5;
      
      if (forecastRainSum > avgHistRain && avgHistRain > 1) {
        percentWetter = Math.round(((forecastRainSum - avgHistRain) / avgHistRain) * 100);
      }
      
      historicalDataSummary = `For this exact calendar week over the last 5 years, ${name} averaged ${avgHistRain.toFixed(1)}mm of cumulative rain. The upcoming 5-day forecast shows ${forecastRainSum.toFixed(1)}mm.`;
    } catch (err: any) {
      console.warn('[Historical processing] Failed to process historical data:', err.message);
    }

    // Process OpenWeatherMap forecast list into 5 days
    const list = forecastResponse.data.list;
    const dailyMap = new Map<string, any[]>();
    
    // Group 3-hour forecasts by day of the week
    list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const array = dailyMap.get(dayName) || [];
      array.push(item);
      dailyMap.set(dayName, array);
    });

    const weekdayOrder = ["Today", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    // Map current conditions
    const current = list[0];
    const temp = Math.round(current.main.temp);
    const feelsLike = Math.round(current.main.feels_like);
    const humidity = current.main.humidity;
    
    const windSpeed = Math.round(current.wind.speed * 3.6); // to km/h
    const windDirMap = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const windDir = windDirMap[Math.round((current.wind.deg % 360) / 22.5) % 16];
    const wind = `${windSpeed} km/h ${windDir}`;

    const sunsetTime = new Date(forecastResponse.data.city.sunset * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Timezone calculations
    const timezoneOffsetSec = forecastResponse.data.city.timezone;
    const offsetHours = timezoneOffsetSec / 3600;
    const timeZoneLabel = offsetHours >= 0 ? `GMT+${offsetHours}` : `GMT${offsetHours}`;
    
    // Fallback/standard mapping for typical places
    const timeZone = `Etc/GMT${offsetHours >= 0 ? '-' : '+'}${Math.abs(offsetHours)}`;

    // Build the 5-day forecast array
    const forecastArray: CityData['forecast'] = [];
    let idx = 0;
    
    dailyMap.forEach((items, dayName) => {
      if (forecastArray.length >= 5) return;
      
      const isToday = dayName === todayName;
      const displayDay = isToday ? "Today" : dayName;

      // Extract min/max and find dominant weather
      let maxT = -99;
      let minT = 99;
      const weatherCounts = new Map<string, number>();
      const weatherIdCounts = new Map<number, number>();

      items.forEach((item) => {
        if (item.main.temp_max > maxT) maxT = item.main.temp_max;
        if (item.main.temp_min < minT) minT = item.main.temp_min;
        
        const mainW = item.weather[0].main;
        const idW = item.weather[0].id;
        
        weatherCounts.set(mainW, (weatherCounts.get(mainW) || 0) + 1);
        weatherIdCounts.set(idW, (weatherIdCounts.get(idW) || 0) + 1);
      });

      // Find dominant weather
      let dominantWeather = "Clear";
      let maxCount = 0;
      weatherCounts.forEach((cnt, w) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          dominantWeather = w;
        }
      });

      let dominantId = 800;
      let maxIdCount = 0;
      weatherIdCounts.forEach((cnt, id) => {
        if (cnt > maxIdCount) {
          maxIdCount = cnt;
          dominantId = id;
        }
      });

      // Map dominant ID to forecast skyType
      let skyType: "sun" | "cloud" | "rain" | "heavy-rain" | "clear" = "sun";
      if (dominantId >= 200 && dominantId < 300) {
        skyType = "heavy-rain";
      } else if (dominantId >= 300 && dominantId < 600) {
        skyType = dominantId >= 502 ? "heavy-rain" : "rain";
      } else if (dominantId >= 803) {
        skyType = "cloud";
      } else if (dominantId === 800) {
        skyType = "clear";
      }

      forecastArray.push({
        day: displayDay,
        tempHigh: Math.round(maxT),
        tempLow: Math.round(minT),
        condition: items[0].weather[0].description,
        skyType,
        hasMiniRain: skyType === "rain" || skyType === "heavy-rain"
      });
    });

    // Map main skyType
    const mainWeatherId = current.weather[0].id;
    let mainSkyType: CityData['skyType'] = "clear";
    if (mainWeatherId >= 200 && mainWeatherId < 300) {
      mainSkyType = "heavy-rain";
    } else if (mainWeatherId >= 300 && mainWeatherId < 600) {
      mainSkyType = mainWeatherId >= 502 ? "heavy-rain" : "rain";
    } else if (mainWeatherId >= 700 && mainWeatherId < 800) {
      mainSkyType = "haze";
    } else if (mainWeatherId >= 803) {
      mainSkyType = "overcast";
    }

    const forecastSummary = forecastArray.map(f => `${f.day}: ${f.tempHigh}°/${f.tempLow}° (${f.condition})`).join(', ');

    // Prepare default AI placeholders
    let aiData = {
      packingNote: "Analyzing packing recommendations...",
      healthNote: "Analyzing health advisory...",
      advisory: "Analyzing weather anomalies...",
      places: [] as any[]
    };
    let places = [] as any[];

    if (!skipAI) {
      // 5. Call Gemini for AI assistance
      try {
        const fetchedAiData = await generateAIAssistance(
          name,
          country,
          temp,
          current.weather[0].description,
          forecastSummary,
          historicalDataSummary
        );
        aiData = fetchedAiData;

        if (aiData.places && Array.isArray(aiData.places) && aiData.places.length > 0) {
          try {
            places = await Promise.all(
              aiData.places.map(async (p: any) => {
                const attractionName = p.name || 'Local Attraction';
                const attractionKey = attractionName.toLowerCase().trim();
                let imgUrl = '';
                // Check in-memory and Redis cache first
                if (wikiImageCache.has(attractionKey)) {
                  imgUrl = wikiImageCache.get(attractionKey) || '';
                } else {
                  try {
                    const cachedImg = await getCache(`wiki-img:${attractionKey}`);
                    if (cachedImg) {
                      imgUrl = cachedImg;
                      wikiImageCache.set(attractionKey, imgUrl);
                    }
                  } catch (cacheErr: any) {
                    console.warn(`[Places Image Cache] Redis read failed for "${attractionName}":`, cacheErr.message);
                  }
                }

                if (!imgUrl) {
                  // 1. Try fetching from Wikipedia using dynamic Search first
                  try {
                    const locationContext = (country && typeof country === 'string') ? country : name;
                    const query = `${attractionName}, ${locationContext}`;
                    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
                    const searchRes = await axios.get(searchUrl, {
                      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                      timeout: 1000 // 1s timeout
                    });
                    const searchResults = searchRes.data?.query?.search;
                    
                    if (searchResults && searchResults.length > 0) {
                      let pageTitle = '';
                      for (const item of searchResults) {
                        const title = item.title;
                        
                        // Skip if the page title is exactly the geocoded city name or country name (generic city pages)
                        if (
                          title.toLowerCase().trim() === name.toLowerCase().trim() || 
                          title.toLowerCase().trim() === country.toLowerCase().trim()
                        ) {
                          continue;
                        }
                        
                        // Heuristic: Ensure the page title shares at least one meaningful word with the attraction name
                        const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                        const attractionWords = normalize(attractionName).filter(w => w !== name.toLowerCase() && w !== country.toLowerCase() && w.length > 2);
                        const titleWords = normalize(title);
                        const hasKeywordMatch = attractionWords.length === 0 || attractionWords.some(w => titleWords.includes(w));
                        
                        if (hasKeywordMatch) {
                          pageTitle = title;
                          break;
                        }
                      }

                      if (pageTitle) {
                        const imgInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
                        const imgInfoRes = await axios.get(imgInfoUrl, {
                          headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                          timeout: 1000 // 1s timeout
                        });
                        const pages = imgInfoRes.data?.query?.pages;
                        if (pages) {
                          const pageId = Object.keys(pages)[0];
                          if (pageId && pages[pageId]?.thumbnail?.source) {
                            imgUrl = pages[pageId].thumbnail.source;
                            console.log(`[Wikipedia Search] Successfully matched image for "${attractionName}" via "${pageTitle}": ${imgUrl}`);
                          }
                        }
                      }
                    }
                  } catch (err: any) {
                    console.warn(`[Wikipedia Search Image API] Failed for "${attractionName}":`, err.message);
                  }
                }

                if (!imgUrl) {
                  // 2. Fallback to Wikimedia Commons search if Wikipedia search had no image
                  try {
                    const locationContext = (country && typeof country === 'string') ? country : name;
                    const query = `${attractionName}, ${locationContext}`;
                    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
                    const commonsRes = await axios.get(commonsUrl, {
                      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                      timeout: 1000 // 1s timeout
                    });
                    const pages = commonsRes.data?.query?.pages;
                    if (pages) {
                      const firstPageId = Object.keys(pages)[0];
                      const imgInfo = pages[firstPageId]?.imageinfo?.[0];
                      if (imgInfo?.thumburl) {
                        imgUrl = imgInfo.thumburl;
                      } else if (imgInfo?.url) {
                        imgUrl = imgInfo.url;
                      }
                    }
                  } catch (err: any) {
                    console.warn(`[Wikimedia Commons API] Failed for "${attractionName}":`, err.message);
                  }
                }

                // Save to in-memory cache and Redis if we resolved a valid Wikimedia/Wikipedia URL
                if (imgUrl && !imgUrl.includes("unsplash.com")) {
                  wikiImageCache.set(attractionKey, imgUrl);
                  try {
                    await setCache(`wiki-img:${attractionKey}`, imgUrl, 86400 * 7); // Cache for 7 days
                  } catch (cacheErr: any) {
                    console.warn(`[Places Image Cache] Redis write failed for "${attractionName}":`, cacheErr.message);
                  }
                }

                // 3. Fallback: try searching Wikipedia for the city name itself to get a general city image dynamically
                if (!imgUrl) {
                  try {
                    const cityQuery = name;
                    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cityQuery)}&utf8=&format=json&origin=*`;
                    const searchRes = await axios.get(searchUrl, {
                      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                      timeout: 1000
                    });
                    const searchResults = searchRes.data?.query?.search;
                    if (searchResults && searchResults.length > 0) {
                      const pageTitle = searchResults[0].title;
                      const imgInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
                      const imgInfoRes = await axios.get(imgInfoUrl, {
                        headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                        timeout: 1000
                      });
                      const pages = imgInfoRes.data?.query?.pages;
                      if (pages) {
                        const pageId = Object.keys(pages)[0];
                        if (pageId && pages[pageId]?.thumbnail?.source) {
                          imgUrl = pages[pageId].thumbnail.source;
                        }
                      }
                    }
                  } catch (err: any) {
                    console.warn(`[Wikipedia City Fallback Search] Failed for "${name}":`, err.message);
                  }
                }

                // 4. Final fallback: Search Commons for the category name dynamically to return a real API-resolved image
                if (!imgUrl) {
                  try {
                    const cat = (p.category || 'city').toLowerCase().trim();
                    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cat)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
                    const commonsRes = await axios.get(commonsUrl, {
                      headers: { 'User-Agent': 'WeatherWiseAI/1.0 (contact@weathermind.com)' },
                      timeout: 1000
                    });
                    const pages = commonsRes.data?.query?.pages;
                    if (pages) {
                      const firstPageId = Object.keys(pages)[0];
                      const imgInfo = pages[firstPageId]?.imageinfo?.[0];
                      if (imgInfo?.thumburl) {
                        imgUrl = imgInfo.thumburl;
                      } else if (imgInfo?.url) {
                        imgUrl = imgInfo.url;
                      }
                    }
                  } catch (err: any) {
                    console.warn(`[Wikimedia Commons Category Fallback] Failed for category "${p.category}":`, err.message);
                  }
                }

                // If still empty (e.g. API is down/throttled), use an empty string but NOT a hardcoded image
                if (!imgUrl) {
                  imgUrl = "";
                }

                return {
                  name: attractionName,
                  image: imgUrl,
                  desc: p.desc || 'A scenic local destination worth visiting.'
                };
              })
            );
          } catch (err: any) {
            console.error('[Places Image Resolution] Error mapping place data:', err.message);
          }
        }
      } catch (err: any) {
        console.error(`[Weather] Error fetching live AI assistance:`, err.message);
      }
    }

    // Override the advisory anomaly with OWM historical data calculations if percentWetter is high
    let advisory = aiData.advisory;
    if (percentWetter > 15) {
      advisory = `This week is running ${percentWetter}% wetter than ${name}'s five-year average — pack a rain shell and build buffer into outdoor plans.`;
    }

    return {
      city: name,
      country,
      condition: current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1),
      temp,
      feelsLike,
      high: Math.round(list.slice(0, 8).reduce((max: number, item: any) => Math.max(max, item.main.temp_max), -99)),
      low: Math.round(list.slice(0, 8).reduce((min: number, item: any) => Math.min(min, item.main.temp_min), 99)),
      wind,
      humidity,
      uvIndex: mainSkyType === "clear" ? 8 : 4, // Estimate UV based on sky
      sunset: sunsetTime,
      timeZone,
      timeZoneLabel,
      advisory: skipAI ? (percentWetter > 15 ? advisory : "Analyzing weather anomalies...") : advisory,
      skyType: mainSkyType,
      forecast: forecastArray,
      packingNote: skipAI ? "Analyzing packing recommendations..." : aiData.packingNote,
      healthNote: `AQI ${aqiValue} (${aqiText}). ` + (skipAI ? "Analyzing health advisory..." : aiData.healthNote),
      places: skipAI ? [] : places,
      isAiPlaceholder: skipAI
    };
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      throw err;
    }
    console.error(`[Weather] Error fetching live data for ${cityName}:`, err.message);
    return generateFallbackCityData(cityName);
  }
}

// Fetch historical weather records for a location and date range
export async function getHistoricalWeatherData(
  cityName: string,
  startDate: string,
  endDate: string
): Promise<{ date: string; tempMax: number; tempMin: number }[]> {
  const OWM_KEY = process.env.OPENWEATHERMAP_API_KEY;
  if (!OWM_KEY) {
    throw new Error("OpenWeatherMap API Key is required for historical weather queries.");
  }

  // 1. Unified geocoding resolution
  const { lat, lon } = await resolveLocation(cityName, OWM_KEY);

  // 2. Fetch from Open-Meteo Archive API
  const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  const response = await axios.get(archiveUrl);

  if (!response.data || !response.data.daily) {
    throw new Error("Failed to retrieve historical weather for the specified date range.");
  }

  const { time, temperature_2m_max, temperature_2m_min } = response.data.daily;
  
  return time.map((t: string, idx: number) => ({
    date: t,
    tempMax: Math.round(temperature_2m_max[idx]),
    tempMin: Math.round(temperature_2m_min[idx])
  }));
}

