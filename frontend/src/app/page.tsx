"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";

// Weather database interface
interface CityData {
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
}

interface HistoricalQuery {
  id: string;
  city: string;
  startDate: string;
  endDate: string;
  results: { date: string; tempMax: number; tempMin: number }[];
  createdAt?: string;
}

// Built-in cities database
const CITIES_DB: Record<string, CityData> = {
  istanbul: {
    city: "Istanbul",
    country: "Turkey",
    condition: "Partly cloudy, light haze near the strait",
    temp: 24,
    feelsLike: 22,
    high: 26,
    low: 18,
    wind: "14 km/h NE",
    humidity: 68,
    uvIndex: 4,
    sunset: "19:42",
    timeZone: "Europe/Istanbul",
    timeZoneLabel: "TRT",
    advisory: "This week is running 40% wetter than Istanbul's five-year average — pack a rain shell and build buffer into outdoor plans for Friday and Saturday.",
    skyType: "haze",
    forecast: [
      { day: "Today", tempHigh: 26, tempLow: 18, condition: "Partly cloudy", skyType: "sun" },
      { day: "Thu", tempHigh: 21, tempLow: 15, condition: "Overcast", skyType: "cloud" },
      { day: "Fri", tempHigh: 17, tempLow: 12, condition: "Rain likely", skyType: "rain", hasMiniRain: true },
      { day: "Sat", tempHigh: 16, tempLow: 11, condition: "Heavy rain", skyType: "heavy-rain", hasMiniRain: true },
      { day: "Sun", tempHigh: 23, tempLow: 15, condition: "Clearing skies", skyType: "clear" }
    ],
    packingNote: "Light layers cover most of the week, but evenings cool off fast. Bring a compact rain shell — Friday and Saturday carry the highest chance of getting caught out.",
    healthNote: "AQI 42, rated good, with no pollen or air quality advisories in effect. Wednesday and Thursday are the clearest windows for time outdoors before the front moves in.",
    places: [
      { name: "Hagia Sophia", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=300&h=220&fit=crop", desc: "A historic monument displaying exquisite Byzantine architecture and Ottoman calligraphy under its grand dome." },
      { name: "Grand Bazaar", image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=300&h=220&fit=crop", desc: "One of the largest and oldest covered markets in the world, with 61 covered streets and over 4,000 shops." },
      { name: "Bosphorus shoreline", image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=300&h=220&fit=crop", desc: "A scenic strait dividing Europe and Asia, lined with Ottoman palaces, historical fortresses, and cozy cafes." }
    ]
  },
  tokyo: {
    city: "Tokyo",
    country: "Japan",
    condition: "Sunny and humid with gentle breeze",
    temp: 29,
    feelsLike: 33,
    high: 31,
    low: 23,
    wind: "8 km/h S",
    humidity: 78,
    uvIndex: 8,
    sunset: "19:01",
    timeZone: "Asia/Tokyo",
    timeZoneLabel: "JST",
    advisory: "High humidity and UV index levels active. Keep hydrated, seek shade between 11:00 and 14:00, and plan indoor museum trips during peak afternoon heat.",
    skyType: "clear",
    forecast: [
      { day: "Today", tempHigh: 31, tempLow: 23, condition: "Sunny", skyType: "clear" },
      { day: "Thu", tempHigh: 32, tempLow: 24, condition: "Sunny", skyType: "clear" },
      { day: "Fri", tempHigh: 30, tempLow: 23, condition: "Passing clouds", skyType: "sun" },
      { day: "Sat", tempHigh: 28, tempLow: 22, condition: "Scattered showers", skyType: "rain", hasMiniRain: true },
      { day: "Sun", tempHigh: 29, tempLow: 23, condition: "Humid & Sunny", skyType: "clear" }
    ],
    packingNote: "Breathable linen, light tees, and comfortable walking shoes. An umbrella is handy for both sudden rain showers and sun shading.",
    healthNote: "AQI 58, moderate. Grass pollen counts are slightly elevated. Best to enjoy outdoor activities in the early morning or evening when temperatures cool.",
    places: [
      { name: "Sensō-ji Temple", image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=300&h=220&fit=crop", desc: "Tokyo's oldest and most iconic Buddhist temple, situated in the heart of historical Asakusa." },
      { name: "Shibuya Crossing", image: "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=300&h=220&fit=crop", desc: "The world's busiest pedestrian intersection, surrounded by flashing neon screens and towering skyscrapers." },
      { name: "Meiji Jingu Shrine", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=220&fit=crop", desc: "A serene Shinto shrine dedicated to Emperor Meiji, nestled within a massive forest of 120,000 trees." }
    ]
  },
  kakinada: {
    city: "Kakinada",
    country: "India",
    condition: "Partly cloudy and humid",
    temp: 31,
    feelsLike: 37,
    high: 34,
    low: 27,
    wind: "12 km/h SSW",
    humidity: 78,
    uvIndex: 9,
    sunset: "18:36",
    timeZone: "Asia/Kolkata",
    timeZoneLabel: "GMT+5.5",
    advisory: "High humidity levels can make it feel like 37°C. Keep hydrated and limit outdoor activity during peak sun hours.",
    skyType: "haze",
    forecast: [
      { day: "Today", tempHigh: 34, tempLow: 27, condition: "Humid & Partly Cloudy", skyType: "sun" },
      { day: "Thu", tempHigh: 35, tempLow: 28, condition: "Mostly Sunny", skyType: "clear" },
      { day: "Fri", tempHigh: 33, tempLow: 27, condition: "Passing Thunderstorms", skyType: "rain", hasMiniRain: true },
      { day: "Sat", tempHigh: 32, tempLow: 26, condition: "Scattered Showers", skyType: "rain", hasMiniRain: true },
      { day: "Sun", tempHigh: 34, tempLow: 27, condition: "Partly Cloudy", skyType: "sun" }
    ],
    packingNote: "Pack lightweight, breathable cotton clothing. A wide-brimmed hat, sunglasses, sunscreen, and a refillable water bottle are highly recommended.",
    healthNote: "AQI 72, moderate. Take precautions if you are sensitive to dust. Drink plenty of water to prevent heat exhaustion.",
    places: [
      { name: "Coringa Wildlife Sanctuary", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&h=220&fit=crop", desc: "India's second largest mangrove forest, home to numerous species of birds, otters, and golden jackals." },
      { name: "NTR Beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=220&fit=crop", desc: "A scenic sandy beach along the Bay of Bengal, perfect for evening walks, local street food, and sunsets." },
      { name: "Annavaram Temple", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=300&h=220&fit=crop", desc: "A prominent hilltop temple dedicated to Lord Veera Venkata Satyanarayana Swamy, located near Kakinada." }
    ]
  },
  reykjavik: {
    city: "Reykjavik",
    country: "Iceland",
    condition: "Overcast and windy with light drizzle",
    temp: 11,
    feelsLike: 8,
    high: 13,
    low: 8,
    wind: "28 km/h NW",
    humidity: 88,
    uvIndex: 1,
    sunset: "23:58",
    timeZone: "Atlantic/Reykjavik",
    timeZoneLabel: "GMT",
    advisory: "Strong winds up to 35 km/h expected along southern coasts. Secure lightweight gear, and plan driving routes with wind advisories in mind.",
    skyType: "overcast",
    forecast: [
      { day: "Today", tempHigh: 13, tempLow: 8, condition: "Overcast", skyType: "cloud" },
      { day: "Thu", tempHigh: 11, tempLow: 7, condition: "Chilly & Windy", skyType: "cloud" },
      { day: "Fri", tempHigh: 10, tempLow: 6, condition: "Steady Drizzle", skyType: "rain", hasMiniRain: true },
      { day: "Sat", tempHigh: 12, tempLow: 8, condition: "Showers", skyType: "rain", hasMiniRain: true },
      { day: "Sun", tempHigh: 14, tempLow: 9, condition: "Clearing Skies", skyType: "sun" }
    ],
    packingNote: "Windproof and waterproof outerwear is essential. Pack thermal base layers, a warm fleece, gloves, and sturdy waterproof hiking boots.",
    healthNote: "AQI 15, exceptionally clean arctic air. No health warnings in effect. Make sure to wear SPF even on overcast days due to high northern latitude glare.",
    places: [
      { name: "Hallgrímskirkja", image: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=300&h=220&fit=crop", desc: "An architectural marvel representing basalt lava flows, offering panoramic views over Reykjavik's colorful roofs." },
      { name: "Harpa Concert Hall", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=300&h=220&fit=crop", desc: "A stunning modern cultural center on the harbor, featuring a glass facade inspired by Iceland's geological formations." },
      { name: "Perlan", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&h=220&fit=crop", desc: "A dome-shaped exhibition center on a hill, containing an indoor ice cave, planetarium, and an observation deck." }
    ]
  },
  paris: {
    city: "Paris",
    country: "France",
    condition: "Mostly sunny with a warm breeze",
    temp: 22,
    feelsLike: 21,
    high: 24,
    low: 15,
    wind: "11 km/h W",
    humidity: 52,
    uvIndex: 5,
    sunset: "21:56",
    timeZone: "Europe/Paris",
    timeZoneLabel: "CEST",
    advisory: "Ideal weather for sightseeing! Evening temperatures fall to 15°C, so have a light sweater ready for dinner cruises on the Seine.",
    skyType: "clear",
    forecast: [
      { day: "Today", tempHigh: 24, tempLow: 15, condition: "Mostly Sunny", skyType: "clear" },
      { day: "Thu", tempHigh: 25, tempLow: 16, condition: "Warm & Clear", skyType: "clear" },
      { day: "Fri", tempHigh: 26, tempLow: 17, condition: "Passing clouds", skyType: "sun" },
      { day: "Sat", tempHigh: 20, tempLow: 13, condition: "Isolated Showers", skyType: "rain", hasMiniRain: true },
      { day: "Sun", tempHigh: 22, tempLow: 14, condition: "Sunny intervals", skyType: "sun" }
    ],
    packingNote: "Smart casual wear fits Paris perfectly. Pack comfortable walking shoes, a light jacket for breezy evenings, and sunglasses for cafe terraces.",
    healthNote: "AQI 38, good. Moderate grass pollen. The air is clean, making it a perfect time for walking tours, cycling, or visiting local parks.",
    places: [
      { name: "Eiffel Tower", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&h=220&fit=crop", desc: "The iconic symbol of Paris, offering breathtaking iron-frame views across the Champ de Mars." },
      { name: "Louvre Museum", image: "https://images.unsplash.com/photo-1597923890187-ad3eb3017266?w=300&h=220&fit=crop", desc: "The world's largest art museum, home to the Mona Lisa and housed in a historic royal fortress." },
      { name: "Seine River Cruise", image: "https://images.unsplash.com/photo-1522083165195-3427502977a1?w=300&h=220&fit=crop", desc: "A scenic boat tour gliding past the historical bridges, Notre-Dame, and Parisian monuments." }
    ]
  },
  "new york": {
    city: "New York",
    country: "USA",
    condition: "Scattered thunderstorms, high humidity",
    temp: 27,
    feelsLike: 31,
    high: 29,
    low: 22,
    wind: "16 km/h S",
    humidity: 82,
    uvIndex: 6,
    sunset: "20:30",
    timeZone: "America/New_York",
    timeZoneLabel: "EDT",
    advisory: "Severe thunderstorm watch in effect. Expect potential flight delays, sudden downpours, and wet sidewalks in midtown Manhattan.",
    skyType: "rain",
    forecast: [
      { day: "Today", tempHigh: 29, tempLow: 22, condition: "Thunderstorms", skyType: "heavy-rain", hasMiniRain: true },
      { day: "Thu", tempHigh: 28, tempLow: 21, condition: "Rain showers", skyType: "rain", hasMiniRain: true },
      { day: "Fri", tempHigh: 27, tempLow: 20, condition: "Mostly cloudy", skyType: "cloud" },
      { day: "Sat", tempHigh: 29, tempLow: 21, condition: "Partly sunny", skyType: "sun" },
      { day: "Sun", tempHigh: 31, tempLow: 22, condition: "Sunny & Humid", skyType: "clear" }
    ],
    packingNote: "A high-quality umbrella and water-resistant shoes are recommended. Wear light, breathable materials to combat high humidity between rain blocks.",
    healthNote: "AQI 65, moderate. Tree and weed pollens are active. Humidity can exacerbate respiratory comfort; seek air-conditioned indoor spaces if sensitive.",
    places: [
      { name: "Central Park", image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=300&h=220&fit=crop", desc: "A massive green oasis in the center of Manhattan, offering lakes, woodlands, and historic bridges." },
      { name: "Times Square", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=300&h=220&fit=crop", desc: "The brightly illuminated hub of the Broadway theater district and a bustling global intersection." },
      { name: "Metropolitan Museum", image: "https://images.unsplash.com/photo-1572953142014-16ce6f0dc424?w=300&h=220&fit=crop", desc: "One of the world's greatest art museums, displaying over two million works spanning 5,000 years." }
    ]
  }
};

// Default static list of saved trips
const DEFAULT_TRIPS = [
  { id: "1", city: "Istanbul", country: "Turkey", dates: "Jun 19 – 26, 2026", tempSnapshot: "24°", info: "Rain Fri–Sat", gradient: "linear-gradient(160deg,#5C87A8,#2E4863)" },
  { id: "2", city: "Tokyo", country: "Japan", dates: "Jul 10 – 18, 2026", tempSnapshot: "29°", info: "Humid", gradient: "linear-gradient(160deg,#5A6A78,#37434E)" },
  { id: "3", city: "Reykjavik", country: "Iceland", dates: "Aug 3 – 9, 2026", tempSnapshot: "14°", info: "Windy", gradient: "linear-gradient(160deg,#4F89A8,#21455C)" }
];

// Helper to generate dynamic weather for any searched city
function generateCityData(cityName: string): CityData {
  const name = cityName.trim();
  const titleName = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  
  // Create a deterministic hash seed from the name to make values stable for the same input
  const charSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const tempSeed = (charSum % 18) + 12; // 12 to 30 deg C
  
  const skyTypes: ("haze" | "overcast" | "rain" | "heavy-rain" | "clear")[] = ["clear", "haze", "overcast", "rain", "heavy-rain"];
  const skyType = skyTypes[charSum % skyTypes.length];
  
  const conditionsMap = {
    clear: "Clear and sunny skies",
    haze: "Partly cloudy with light haze",
    overcast: "Overcast and breezy",
    rain: "Light rain showers",
    "heavy-rain": "Heavy rain and thunderstorms"
  };
  
  const condition = conditionsMap[skyType];
  const high = tempSeed + (charSum % 3) + 1;
  const low = tempSeed - (charSum % 4) - 2;
  const humidity = 45 + (charSum % 45);
  const uvIndex = 1 + (charSum % 9);
  const windSpd = 5 + (charSum % 25);
  const sunsetMin = 10 + (charSum % 50);
  
  const forecastSkyTypes: ("sun" | "cloud" | "rain" | "heavy-rain" | "clear")[] = ["sun", "cloud", "rain", "heavy-rain", "clear"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const forecast = Array.from({ length: 5 }, (_, i) => {
    const fSky = forecastSkyTypes[(charSum + i) % forecastSkyTypes.length];
    const isRain = fSky === "rain" || fSky === "heavy-rain";
    const dayIndex = (new Date().getDay() + i) % 7;
    return {
      day: i === 0 ? "Today" : days[dayIndex],
      tempHigh: high + (i % 2 === 0 ? 1 : -2),
      tempLow: low + (i % 2 === 0 ? -1 : 1),
      condition: fSky === "sun" ? "Partly cloudy" : fSky === "cloud" ? "Overcast" : fSky === "clear" ? "Sunny" : "Rainy",
      skyType: fSky,
      hasMiniRain: isRain
    };
  });
  
  return {
    city: titleName,
    country: name.length % 2 === 0 ? "Europe" : "Americas",
    condition,
    temp: tempSeed,
    feelsLike: tempSeed + (skyType === "heavy-rain" || skyType === "rain" ? -2 : 1),
    high,
    low,
    wind: `${windSpd} km/h NE`,
    humidity,
    uvIndex,
    sunset: `20:${sunsetMin < 10 ? "0" + sunsetMin : sunsetMin}`,
    timeZone: "UTC",
    timeZoneLabel: "UTC",
    advisory: `Conditions in ${titleName} are currently seasonal. There is a ${humidity}% humidity index, making for comfortable outdoor periods, though packing a light layer is recommended.`,
    skyType,
    forecast,
    packingNote: `Temps will hover around a high of ${high}°C. Breathable fabrics are ideal, along with a waterproof jacket just in case.`,
    healthNote: "AQI is 48, rated good. No air quality issues, and low allergen thresholds are reported. Perfect for local walks.",
    places: [
      { name: `${titleName} Plaza`, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&h=220&fit=crop", desc: "A vibrant city square serving as the perfect central spot to explore local dining, shopping, and landmarks." },
      { name: `${titleName} Gardens`, image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=220&fit=crop", desc: "A relaxing green space with indigenous flora and beautifully curated walking tracks." },
      { name: `Scenic Riverwalk`, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=220&fit=crop", desc: "A panoramic pathway offering beautiful views of the local waterways and skyline." }
    ]
  };
}

// Formatting dates for displaying saved trips
function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return "";
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startFormatted = start.toLocaleDateString("en-US", options);
  const endFormatted = end.toLocaleDateString("en-US", { day: "numeric" });
  const year = start.getFullYear();
  
  if (start.getMonth() === end.getMonth()) {
    return `${startFormatted} – ${endFormatted}, ${year}`;
  } else {
    const endFullFormatted = end.toLocaleDateString("en-US", options);
    return `${startFormatted} – ${endFullFormatted}, ${year}`;
  }
}



const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// Helper to parse date ranges back to YYYY-MM-DD for editing
function parseDateRange(datesStr: string): { start: string; end: string } {
  try {
    const cleaned = datesStr.replace(/\s+/g, " ");
    const parts = cleaned.split(/ [–-]/);
    if (parts.length < 2) return { start: "", end: "" };
    
    const startPart = parts[0].trim();
    const endPartWithYear = parts[1].trim();
    
    const yearMatch = endPartWithYear.match(/,?\s*(\d{4})$/);
    if (!yearMatch) return { start: "", end: "" };
    const year = yearMatch[1];
    
    const endPart = endPartWithYear.replace(/,?\s*\d{4}$/, "").trim();
    
    const monthNames: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    
    const startSplit = startPart.split(" ");
    if (startSplit.length < 2) return { start: "", end: "" };
    const startMonthAbbr = startSplit[0].toLowerCase().substring(0, 3);
    const startMonth = monthNames[startMonthAbbr];
    const startDay = startSplit[1].padStart(2, "0");
    
    let endMonth = startMonth;
    let endDay = "";
    
    const endSplit = endPart.split(" ");
    if (endSplit.length === 1) {
      endDay = endSplit[0].padStart(2, "0");
    } else if (endSplit.length === 2) {
      const endMonthAbbr = endSplit[0].toLowerCase().substring(0, 3);
      endMonth = monthNames[endMonthAbbr];
      endDay = endSplit[1].padStart(2, "0");
    } else {
      return { start: "", end: "" };
    }
    
    if (!startMonth || !endMonth) return { start: "", end: "" };
    
    return {
      start: `${year}-${startMonth}-${startDay}`,
      end: `${year}-${endMonth}-${endDay}`
    };
  } catch (err) {
    console.warn("Failed to parse date range:", datesStr, err);
    return { start: "", end: "" };
  }
}

interface WeatherSceneProps {
  skyType: string;
  condition: string;
  temp: number;
  wind: string;
  localHour: number;
}

interface WeatherParticle {
  x: number;
  y: number;
  vy: number;
  vx: number;
  len: number;
  r: number;
  swing: number;
  swingSpeed: number;
  swingStep: number;
  opacity: number;
}

interface StarParticle {
  x: number;
  y: number;
  r: number;
  opacity: number;
  speed: number;
}

interface CloudElement {
  id: number;
  layer: number;
  duration: string;
  delay: string;
  top: string;
  scale: number;
  opacity: number;
  color: string;
}

interface PlannerScheduleItem {
  time: string;
  activity: string;
  note: string;
}

interface PlannedItineraryDay {
  dayName: string;
  weather: {
    temp: number;
    cond: string;
  };
  schedule: PlannerScheduleItem[];
  packingTip: string;
}

const WeatherScene: React.FC<WeatherSceneProps> = ({
  skyType,
  condition,
  temp,
  wind,
  localHour
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse wind speed (default 10 km/h if not found)
  const windSpeed = useMemo(() => {
    const match = wind.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  }, [wind]);

  // Determine time-of-day categories
  const isSunrise = localHour >= 6 && localHour < 8;
  const isSunset = localHour >= 17 && localHour < 19;
  const isNight = localHour >= 19 || localHour < 6;

  // Compute dynamic sky gradient
  const skyBackground = useMemo(() => {
    if (isSunrise) {
      return "linear-gradient(180deg, #E65C00 0%, #F9D423 50%, #225e79 100%)";
    }
    if (isSunset) {
      return "linear-gradient(180deg, #1A0B2E 0%, #962B4C 45%, #E87A5D 75%, #F4C480 100%)";
    }
    if (isNight) {
      if (skyType === "haze") return "linear-gradient(180deg, #161B29 0%, #0F121C 50%, #07080E 100%)";
      if (skyType === "overcast") return "linear-gradient(180deg, #1C2230 0%, #131722 50%, #0A0C12 100%)";
      if (skyType === "rain" || skyType === "heavy-rain") return "linear-gradient(180deg, #121620 0%, #0B0D14 50%, #05060A 100%)";
      return "linear-gradient(180deg, #0B1021 0%, #050814 50%, #010206 100%)"; // clear night
    }
    // daytime
    if (skyType === "clear") return "linear-gradient(180deg, #4A7A96 0%, #294F66 38%, #1A3445 68%, #0F202B 100%)";
    if (skyType === "overcast") return "linear-gradient(180deg, #5A6A78 0%, #3B4752 38%, #252F38 68%, #161E24 100%)";
    if (skyType === "rain" || skyType === "heavy-rain") return "linear-gradient(180deg, #344454 0%, #212D38 38%, #141C24 68%, #0C1217 100%)";
    return "linear-gradient(180deg, #3A5470 0%, #26384C 38%, #172430 68%, #0E1620 100%)"; // haze daytime
  }, [isSunrise, isSunset, isNight, skyType]);

  // Sun and Moon positions along an astronomical arc
  const celestials = useMemo(() => {
    // 6 AM is 0, 6 PM is 1
    const progress = (localHour >= 6 && localHour < 18)
      ? (localHour - 6) / 12
      : (localHour >= 18 ? (localHour - 18) / 12 : (localHour + 6) / 12);

    const x = 15 + progress * 70; // 15% to 85% width
    const y = 35 - Math.sin(progress * Math.PI) * 20; // peaks at 15% depth

    // Moon phase: calculate based on day of month (approximate lunar phase)
    const dayOfMonth = new Date().getDate();
    const phaseIndex = dayOfMonth % 4; // 0: crescent, 1: half, 2: gibbous, 3: full
    
    // Correct shadow offsets for a beautiful transition:
    // 72: leaves a thin illuminated crescent
    // 95: leaves exactly half the moon illuminated
    // 115: leaves a wider gibbous moon illuminated
    // 160: fully illuminates the moon (full moon)
    const maskCx = phaseIndex === 0 ? 72 : phaseIndex === 1 ? 95 : phaseIndex === 2 ? 115 : 160;

    return { x, y, maskCx };
  }, [localHour]);

  // Rain & Snow Particle simulation inside Canvas for maximum 60fps performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Weather type configurations
    const isRaining = skyType === "rain" || skyType === "heavy-rain";
    const isSnowing = condition.toLowerCase().includes("snow") || condition.toLowerCase().includes("chill") || temp < 3;
    const isThunderstorm = skyType === "heavy-rain";

    // Particles array
    const particles: WeatherParticle[] = [];
    const maxParticles = skyType === "heavy-rain" ? 120 : isRaining ? 60 : isSnowing ? 80 : 0;

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      if (isRaining) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          vy: 8 + Math.random() * 8 + (skyType === "heavy-rain" ? 4 : 0),
          vx: (windSpeed / 10) * (Math.random() * 1.5 + 0.5),
          len: 12 + Math.random() * 16,
          r: 0,
          swing: 0,
          swingSpeed: 0,
          swingStep: 0,
          opacity: 0.2 + Math.random() * 0.4
        });
      } else if (isSnowing) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          vy: 1 + Math.random() * 2,
          vx: (windSpeed / 15) + Math.random() - 0.5,
          len: 0,
          r: 2 + Math.random() * 3,
          swing: Math.random() * 10,
          swingSpeed: 0.01 + Math.random() * 0.02,
          swingStep: Math.random() * 100,
          opacity: 0.3 + Math.random() * 0.5
        });
      }
    }

    // Stars (at night)
    const starParticles: StarParticle[] = [];
    if (isNight) {
      for (let i = 0; i < 40; i++) {
        starParticles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.6),
          r: 0.8 + Math.random() * 1.2,
          opacity: Math.random(),
          speed: 0.005 + Math.random() * 0.01
        });
      }
    }

    // Lightning parameters
    let flashOpacity = 0;
    let nextFlash = 100 + Math.random() * 300;

    // Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Stars at Night
      if (isNight && starParticles.length > 0) {
        ctx.fillStyle = "#ffffff";
        starParticles.forEach(star => {
          star.opacity += star.speed;
          if (star.opacity > 1 || star.opacity < 0) {
            star.speed = -star.speed;
          }
          ctx.globalAlpha = Math.max(0, Math.min(1, star.opacity));
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      // 2. Draw Lightning
      if (isThunderstorm) {
        nextFlash--;
        if (nextFlash <= 0) {
          flashOpacity = 0.6 + Math.random() * 0.4;
          nextFlash = 250 + Math.random() * 400; // resets interval
        }
        if (flashOpacity > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
          ctx.fillRect(0, 0, width, height);
          flashOpacity -= 0.05; // fade flash
        }
      }

      // 3. Draw Particles (Rain or Snow)
      if (isRaining) {
        ctx.strokeStyle = "rgba(174, 194, 224, 0.5)";
        ctx.lineWidth = 1.5;
        particles.forEach(p => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx, p.y + p.vy);
          ctx.stroke();

          // Move
          p.y += p.vy;
          p.x += p.vx;

          // Recycle
          if (p.y > height) {
            p.y = -p.len;
            p.x = Math.random() * width;
          }
        });
        ctx.globalAlpha = 1.0;
      } else if (isSnowing) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        particles.forEach(p => {
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          p.swingStep += p.swingSpeed;
          const xOffset = Math.sin(p.swingStep) * p.swing;
          ctx.arc(p.x + xOffset, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          // Move
          p.y += p.vy;
          p.x += p.vx;

          // Recycle
          if (p.y > height) {
            p.y = -p.r * 2;
            p.x = Math.random() * width;
          }
        });
        ctx.globalAlpha = 1.0;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [skyType, condition, temp, windSpeed, isNight]);

  // Compute dynamic cloud properties based on wind speed & skyType
  const clouds = useMemo(() => {
    const list: CloudElement[] = [];
    let cloudDensity = 0;
    if (skyType === "clear") cloudDensity = 1;
    else if (skyType === "haze") cloudDensity = 3;
    else if (skyType === "overcast") cloudDensity = 6;
    else cloudDensity = 8; // rain/storm

    const colors = {
      storm: "rgba(32, 42, 58, 0.92)",
      night: "rgba(40, 52, 70, 0.65)",
      day: "rgba(255, 255, 255, 0.82)"
    };
    const color = (skyType === "rain" || skyType === "heavy-rain")
      ? colors.storm
      : isNight ? colors.night : colors.day;

    for (let i = 0; i < cloudDensity; i++) {
      // 3 parallax layers (speed, scale, depth)
      const layer = (i % 3) + 1; // 1: far/slow, 2: mid, 3: near/fast

      // Calculate speed: higher layer = faster, higher windSpeed = faster
      const windFactor = Math.max(3, windSpeed);
      const baseDuration = layer === 1 ? 160 : layer === 2 ? 100 : 60;
      const duration = baseDuration / (windFactor / 10);

      const delayVal = ((i * 37) % baseDuration).toFixed(1);
      const topVal = (10 + ((i * 7) % 32)).toFixed(1);

      list.push({
        id: i,
        layer,
        duration: duration.toFixed(1),
        delay: `-${delayVal}s`,
        top: `${topVal}%`,
        scale: layer === 1 ? 0.6 : layer === 2 ? 0.85 : 1.1,
        opacity: layer === 1 ? 0.35 : layer === 2 ? 0.65 : 0.85,
        color
      });
    }

    return list;
  }, [skyType, windSpeed, isNight]);

  if (!mounted) {
    return (
      <div
        className="absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none"
        style={{ background: skyBackground }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none"
      style={{ background: skyBackground }}
    >
      <style>{`
        @keyframes drift {
          from { transform: translate3d(-300px, 0, 0); }
          to { transform: translate3d(100vw, 0, 0); }
        }
        @keyframes sunGlow {
          0%, 100% {
            box-shadow: 0 0 35px 8px rgba(255, 230, 180, 0.5), 0 0 65px 18px rgba(232, 184, 109, 0.25);
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            box-shadow: 0 0 50px 12px rgba(255, 230, 180, 0.65), 0 0 80px 25px rgba(232, 184, 109, 0.35);
            transform: translate(-50%, -50%) scale(1.04);
          }
        }
      `}</style>

      {/* 1. Dynamic Sun / Moon */}
      {(!isNight && (skyType === "clear" || skyType === "haze" || skyType === "rain")) && (
        <div
          className="absolute w-[120px] h-[120px] rounded-full transition-all duration-1000 bg-gradient-to-br from-[#FFE7B8] via-[#E8B86D] to-[#C98C4A]"
          style={{
            left: `${celestials.x}%`,
            top: `${celestials.y}%`,
            transform: "translate(-50%, -50%)",
            animation: "sunGlow 8s ease-in-out infinite"
          }}
        />
      )}

      {isNight && (
        <div
          className="absolute w-[110px] h-[110px] transition-all duration-1000"
          style={{
            left: `${celestials.x}%`,
            top: `${celestials.y}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <svg className="w-[110px] h-[110px] drop-shadow-[0_0_20px_rgba(229,233,240,0.35)]" viewBox="0 0 100 100">
            <defs>
              <mask id="moon-mask">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <circle cx={celestials.maskCx} cy="50" r="45" fill="black" />
              </mask>
            </defs>
            <circle cx="50" cy="50" r="45" fill="#E5E9F0" mask="url(#moon-mask)" />
            <circle cx="35" cy="30" r="7" fill="#D8DEE9" opacity="0.4" mask="url(#moon-mask)" />
            <circle cx="65" cy="55" r="9" fill="#D8DEE9" opacity="0.4" mask="url(#moon-mask)" />
            <circle cx="45" cy="68" r="5" fill="#D8DEE9" opacity="0.4" mask="url(#moon-mask)" />
          </svg>
        </div>
      )}

      {/* 2. Parallax Cloud Layers */}
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="absolute transition-transform will-change-transform"
          style={{
            top: cloud.top,
            left: "-300px",
            opacity: cloud.opacity,
            transform: `scale(${cloud.scale})`,
            animationName: "drift",
            animationDuration: `${cloud.duration}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDelay: cloud.delay,
            zIndex: cloud.layer
          }}
        >
          <svg viewBox="0 0 240 90" width="240" height="90">
            <path
              d="M40 70 Q20 70 20 50 Q20 30 42 32 Q46 12 70 14 Q96 -2 116 16 Q140 10 150 30 Q176 28 180 50 Q200 50 200 66 Q200 78 184 78 L42 78 Q40 78 40 70Z"
              fill={cloud.color}
            />
          </svg>
        </div>
      ))}

      {/* 3. High Performance Canvas for rain / snow / stars / lightning */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Fog / Mist Blur Overlay */}
      {skyType === "haze" && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-white/5 pointer-events-none" />
      )}
    </div>
  );
};

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData>(CITIES_DB.istanbul);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localTime, setLocalTime] = useState("—");
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  // Trip management state
  const [trips, setTrips] = useState<typeof DEFAULT_TRIPS>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalCity, setModalCity] = useState("");
  const [modalStart, setModalStart] = useState("");
  const [modalEnd, setModalEnd] = useState("");
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Planner modal state
  const [plannerTrip, setPlannerTrip] = useState<typeof DEFAULT_TRIPS[number] | null>(null);
  const [plannerDestinations, setPlannerDestinations] = useState<string[]>([]);
  const [newDestinationInput, setNewDestinationInput] = useState("");
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [plannedItinerary, setPlannedItinerary] = useState<PlannedItineraryDay[] | null>(null);

  // Historical query state
  const [histCity, setHistCity] = useState("");
  const [histStart, setHistStart] = useState("");
  const [histEnd, setHistEnd] = useState("");
  const [histResults, setHistResults] = useState<{ date: string; tempMax: number; tempMin: number }[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [recentHistQueries, setRecentHistQueries] = useState<HistoricalQuery[]>([]);

  const fetchRecentHistQueries = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/weather/history/recent`);
      if (res.ok) {
        const data = await res.json();
        setRecentHistQueries(data);
      }
    } catch (err) {
      console.warn("Could not fetch recent historical queries", err);
    }
  };

  // Places detail state
  const [selectedPlace, setSelectedPlace] = useState<{ name: string; image: string; desc: string } | null>(null);

  // YouTube videos state
  const [ytVideos, setYtVideos] = useState<{ title: string; videoId: string; thumbnail: string }[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize and mount
  useEffect(() => {
    setIsMounted(true);
    fetchRecentHistQueries();
    
    // Fetch trips from backend if available, otherwise load from localStorage
    const loadTrips = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/trips`);
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
          localStorage.setItem("weathermind_trips", JSON.stringify(data));
          return;
        }
      } catch (err) {
        console.warn("Backend API offline, falling back to localStorage", err);
      }
      
      const saved = localStorage.getItem("weathermind_trips");
      if (saved) {
        try {
          setTrips(JSON.parse(saved));
        } catch {
          setTrips(DEFAULT_TRIPS);
        }
      } else {
        setTrips(DEFAULT_TRIPS);
        localStorage.setItem("weathermind_trips", JSON.stringify(DEFAULT_TRIPS));
      }
    };
    
    loadTrips();
  }, []);


  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch YouTube travel guides for the selected city
  useEffect(() => {
    if (!selectedCity?.city) return;
    const fetchYt = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/youtube?query=${encodeURIComponent(selectedCity.city)}`);
        if (res.ok) {
          const data = await res.json();
          setYtVideos(data);
        }
      } catch (err) {
        console.warn("Failed to fetch YouTube videos", err);
      }
    };
    fetchYt();
  }, [selectedCity.city]);

  // Update clock timezone-aware
  useEffect(() => {
    const updateClock = () => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-GB", {
          timeZone: selectedCity.timeZone === "UTC" ? undefined : selectedCity.timeZone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        }).format(new Date());
        setLocalTime(`${timeStr} ${selectedCity.timeZoneLabel}`);
      } catch {
        // Fallback for non-integer timezone offsets (e.g. Etc/GMT-5.5) which throw errors in Intl
        try {
          let offsetHours = 0;
          
          // Parse POSIX offset from Etc/GMT+/-X (Note: POSIX signs are inverted)
          const tzMatch = selectedCity.timeZone?.match(/Etc\/GMT([+-])(\d+(?:\.\d+)?)/i);
          if (tzMatch) {
            const sign = tzMatch[1] === "-" ? 1 : -1;
            offsetHours = sign * parseFloat(tzMatch[2]);
          } else {
            // Fallback: Parse from GMT+/-X label
            const labelMatch = selectedCity.timeZoneLabel?.match(/GMT([+-])(\d+(?:\.\d+)?)/i);
            if (labelMatch) {
              const sign = labelMatch[1] === "+" ? 1 : -1;
              offsetHours = sign * parseFloat(labelMatch[2]);
            }
          }
          
          const now = new Date();
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const targetTime = new Date(utc + offsetHours * 3600000);
          
          const hh = String(targetTime.getHours()).padStart(2, "0");
          const mm = String(targetTime.getMinutes()).padStart(2, "0");
          
          setLocalTime(`${hh}:${mm} ${selectedCity.timeZoneLabel || ""}`);
        } catch {
          setLocalTime("—");
        }
      }
    };
    
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, [selectedCity]);



  // Search autocomplete suggestion list
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery) return Object.values(CITIES_DB);
    const query = searchQuery.toLowerCase();
    return Object.values(CITIES_DB).filter(
      item => item.city.toLowerCase().includes(query) || item.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Trigger geolocation
  const handleGeolocation = () => {
    if ("geolocation" in navigator) {
      setIsLoadingWeather(true);
      setGlobalError(null);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // 1. Try free client-side BigDataCloud Reverse Geocoding first (no key required, robust)
          try {
            const clientGeoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            if (clientGeoRes.ok) {
              const clientGeoData = await clientGeoRes.json();
              const cityName = clientGeoData.city || clientGeoData.locality || clientGeoData.principalSubdivision;
              if (cityName) {
                await handleSearchSubmit(cityName);
                return;
              }
            }
          } catch (err) {
            console.warn("Client-side reverse geocode failed, trying backend endpoint", err);
          }

          // 2. Try backend OpenWeatherMap geocode endpoint as fallback
          try {
            const res = await fetch(`${BACKEND_URL}/api/weather/reverse?lat=${lat}&lon=${lon}`);
            if (res.ok) {
              const data = await res.json();
              if (data.city) {
                await handleSearchSubmit(data.city);
                return;
              }
            }
          } catch (err) {
            console.warn("Could not reverse geocode via backend, falling back to coordinate search", err);
          }
          
          // 3. Last fallback: display coordinates
          const latStr = lat.toFixed(2);
          const lonStr = lon.toFixed(2);
          const locationData: CityData = {
            ...generateCityData(`My Location (${latStr}, ${lonStr})`),
            city: `Location (${latStr}, ${lonStr})`,
            country: `GPS`,
            timeZone: "UTC",
            timeZoneLabel: "UTC"
          };
          setSelectedCity(locationData);
          setSearchQuery(`Location (${latStr}, ${lonStr})`);
          setIsLoadingWeather(false);
        },
        (error) => {
          console.warn("Geolocation permission/retrieval failed:", error.message);
          setGlobalError("Unable to access your location. Please check your browser's location permissions.");
          setIsLoadingWeather(false);
        }
      );
    } else {
      setGlobalError("Geolocation is not supported by your browser.");
    }
  };

  // Perform search submit
  const handleSearchSubmit = async (cityName: string) => {
    if (!cityName) return;
    const key = cityName.toLowerCase().trim();
    setGlobalError(null);
    setIsLoadingWeather(true);
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const startTime = Date.now();

    try {
      // Try to fetch from backend first to get dynamic AI and real weather/images
      try {
        const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(cityName)}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedCity(data);
          setSearchQuery(data.city);
          setShowSuggestions(false);
          setIsLoadingWeather(false);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend fetch failed, trying local pre-configured DB:", backendErr);
      }

      // Check if it is a local pre-configured city
      if (CITIES_DB[key]) {
        setSelectedCity(CITIES_DB[key]);
        setSearchQuery(CITIES_DB[key].city);
        setShowSuggestions(false);
        
        const elapsed = Date.now() - startTime;
        if (elapsed < 500) {
          await delay(500 - elapsed);
        }
        setIsLoadingWeather(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(cityName)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCity(data);
        setSearchQuery(data.city);
        setShowSuggestions(false);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || `City "${cityName}" not found.`);
      }
    } catch (err) {
      console.error("Weather fetch failed:", err);
      let errMsg = err instanceof Error ? err.message : `Failed to fetch weather for "${cityName}".`;
      if (errMsg === "Failed to fetch") {
        errMsg = `Could not connect to the WeatherMind API Backend at ${BACKEND_URL}. Real-time searches and AI recommendations are currently unavailable. Please verify that your backend server is deployed/running and that the NEXT_PUBLIC_BACKEND_URL environment variable is configured in your Vercel Project Settings.`;
      }
      setGlobalError(errMsg);
      setShowSuggestions(false);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await delay(500 - elapsed);
      }
      setIsLoadingWeather(false);
    }
  };

  const handleHistoricalQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!histCity || !histStart || !histEnd) {
      setHistError("Please provide city, start date, and end date.");
      return;
    }

    const start = new Date(histStart);
    const end = new Date(histEnd);
    const today = new Date();

    const minDate = new Date('1940-01-01');

    if (start < minDate) {
      setHistError("Start Date cannot be before 1940-01-01.");
      return;
    }
    if (start > end) {
      setHistError("Start Date must be before or equal to End Date.");
      return;
    }
    if (end > today) {
      setHistError("End Date cannot be in the future for historical lookup.");
      return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 90) {
      setHistError("Date range cannot exceed 90 days.");
      return;
    }

    setHistLoading(true);
    setHistError(null);
    setHistResults(null);

    try {
      const url = `${BACKEND_URL}/api/weather/history?city=${encodeURIComponent(histCity)}&startDate=${histStart}&endDate=${histEnd}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `City "${histCity}" not found or date range invalid.`);
      }
      const data = await res.json();
      setHistResults(data);
      fetchRecentHistQueries();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to fetch historical weather data.";
      setHistError(errMsg);
    } finally {
      setHistLoading(false);
    }
  };

  // Search input events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery) {
      handleSearchSubmit(searchQuery);
    }
  };

  // Saved trip actions
  const handleDeleteTrip = async (id: string) => {
    const updated = trips.filter(t => t.id !== id);
    setTrips(updated);
    localStorage.setItem("weathermind_trips", JSON.stringify(updated));

    try {
      await fetch(`${BACKEND_URL}/api/trips/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Could not delete from backend database, saved locally.", err);
    }
  };

  const handleOpenEditModal = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (trip) {
      setEditingTripId(id);
      setModalCity(trip.city);
      const parsed = parseDateRange(trip.dates);
      setModalStart(parsed.start);
      setModalEnd(parsed.end);
      setModalError(null);
      setShowModal(true);
    }
  };

  const handleOpenNewModal = () => {
    setEditingTripId(null);
    setModalCity("");
    setModalStart("");
    setModalEnd("");
    setModalError(null);
    setShowModal(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCity || !modalStart || !modalEnd) return;

    // Date range validation
    const start = new Date(modalStart);
    const end = new Date(modalEnd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start > end) {
      setModalError("End date must be after or equal to start date.");
      return;
    }
    if (start < today) {
      setModalError("Trip start date cannot be in the past.");
      return;
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setModalError("Trip duration cannot exceed 365 days.");
      return;
    }

    setModalSaving(true);
    setModalError(null);

    const formattedDates = formatDateRange(modalStart, modalEnd);
    const key = modalCity.toLowerCase().trim();
    
    // First, check local DB for instant resolution, then fetch from API
    let weatherRef = null;
    let isNotFound = false;
    let isOffline = false;

    if (CITIES_DB[key]) {
      weatherRef = CITIES_DB[key];
    } else {
      try {
        const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(modalCity)}`);
        if (res.ok) {
          weatherRef = await res.json();
        } else if (res.status === 404) {
          isNotFound = true;
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Validation error");
        }
      } catch (err) {
        console.warn("Could not fetch city weather from API", err);
        if (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("network"))) {
          isOffline = true;
        }
      }
    }

    if (isNotFound) {
      setModalError(`City "${modalCity}" not found. Please enter a valid global city name.`);
      setModalSaving(false);
      return;
    }

    if (!weatherRef) {
      if (isOffline) {
        setModalError("Unable to validate city because the weather service is offline. Please try again later.");
      } else {
        setModalError(`City "${modalCity}" could not be validated. Please enter a valid global city name.`);
      }
      setModalSaving(false);
      return;
    }

    const tempSnapshot = `${weatherRef.temp}°`;
    const info = weatherRef.skyType === "rain" || weatherRef.skyType === "heavy-rain" 
      ? "Rainy outlook" 
      : weatherRef.skyType === "clear" 
      ? "Clear skies" 
      : "Partly cloudy";

    const gradientMap = {
      haze: "linear-gradient(160deg,#5C87A8,#2E4863)",
      clear: "linear-gradient(160deg,#4F89A8,#21455C)",
      overcast: "linear-gradient(160deg,#5A6A78,#37434E)",
      rain: "linear-gradient(160deg,#445566,#222E38)",
      "heavy-rain": "linear-gradient(160deg,#37424C,#161E25)"
    };
    const gradient = gradientMap[weatherRef.skyType as keyof typeof gradientMap] || "linear-gradient(160deg,#5C87A8,#2E4863)";

    if (editingTripId) {
      const updated = trips.map(t => {
        if (t.id === editingTripId) {
          return { ...t, city: weatherRef!.city, country: weatherRef!.country, dates: formattedDates, tempSnapshot, info, gradient };
        }
        return t;
      });
      setTrips(updated);
      localStorage.setItem("weathermind_trips", JSON.stringify(updated));

      try {
        await fetch(`${BACKEND_URL}/api/trips/${editingTripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: weatherRef.city,
            country: weatherRef.country,
            dates: formattedDates,
            tempSnapshot,
            info,
            gradient
          })
        });
      } catch (err) {
        console.warn("Could not save edit to backend", err);
      }
    } else {
      const tempId = Math.random().toString(36).substring(2, 11);
      const newTripLocal = {
        id: tempId,
        city: weatherRef.city,
        country: weatherRef.country,
        dates: formattedDates,
        tempSnapshot,
        info,
        gradient
      };
      
      const updated = [...trips, newTripLocal];
      setTrips(updated);
      localStorage.setItem("weathermind_trips", JSON.stringify(updated));

      try {
        const res = await fetch(`${BACKEND_URL}/api/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTripLocal)
        });
        if (res.ok) {
          const savedTrip = await res.json();
          const synced = updated.map(t => t.id === tempId ? savedTrip : t);
          setTrips(synced);
          localStorage.setItem("weathermind_trips", JSON.stringify(synced));
        }
      } catch (err) {
        console.warn("Could not save new trip to database, kept in offline state.", err);
      }
    }

    setModalSaving(false);
    setShowModal(false);
  };

  const handleOpenPlanner = (trip: typeof DEFAULT_TRIPS[number]) => {
    setPlannerTrip(trip);
    setPlannedItinerary(null);
    setIsGeneratingItinerary(false);
    setGenerationProgress(0);

    const dbKey = trip.city.toLowerCase();
    const dbCity = CITIES_DB[dbKey as keyof typeof CITIES_DB];
    if (dbCity) {
      setPlannerDestinations(dbCity.places.map(p => p.name));
    } else {
      setPlannerDestinations([
        `${trip.city} Historic Center`,
        `${trip.city} Central Park`
      ]);
    }
  };

  const handleGenerateItinerary = () => {
    if (!plannerTrip) return;
    setIsGeneratingItinerary(true);
    setGenerationProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setGenerationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        
        const dbKey = plannerTrip.city.toLowerCase();
        const dbCity = CITIES_DB[dbKey as keyof typeof CITIES_DB];
        
        const daysToPlan = 3;
        const generatedDays = [];
        
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const startDayIndex = new Date().getDay();

        const forecastSource = dbCity ? dbCity.forecast : [
          { tempHigh: 28, condition: "Partly cloudy", skyType: "sun" },
          { tempHigh: 24, condition: "Light rain showers", skyType: "rain" },
          { tempHigh: 29, condition: "Sunny & Warm", skyType: "clear" }
        ];

        const destinationsCopy = [...plannerDestinations];

        for (let i = 0; i < daysToPlan; i++) {
          const dayName = daysOfWeek[(startDayIndex + i) % 7];
          const weatherDay = forecastSource[i % forecastSource.length];
          const tempVal = weatherDay ? weatherDay.tempHigh : 25;
          const condText = weatherDay ? weatherDay.condition : "Partly cloudy";
          const skyVal = weatherDay ? weatherDay.skyType : "sun";

          const isRainy = skyVal === "rain" || skyVal === "heavy-rain";

          const indoorAttractions: string[] = [];
          const outdoorAttractions: string[] = [];

          destinationsCopy.forEach(dest => {
            const lower = dest.toLowerCase();
            if (
              lower.includes("museum") ||
              lower.includes("temple") ||
              lower.includes("gallery") ||
              lower.includes("bazaar") ||
              lower.includes("mall") ||
              lower.includes("shopping") ||
              lower.includes("church") ||
              lower.includes("indoor")
            ) {
              indoorAttractions.push(dest);
            } else {
              outdoorAttractions.push(dest);
            }
          });

          const daySchedule = [];
          
          if (isRainy) {
            const item1 = indoorAttractions.shift() || outdoorAttractions.shift() || "Explore Local Cuisine";
            const item2 = indoorAttractions.shift() || outdoorAttractions.shift() || "Relaxing Café Stop";
            
            daySchedule.push({
              time: "10:00 AM",
              activity: item1,
              note: `Perfect choice for today's rainfall. This indoor spot will keep you dry while enjoying your morning.`
            });
            daySchedule.push({
              time: "02:30 PM",
              activity: item2,
              note: `Rain is expected to intensify. Retracting to this sheltered destination keeps your group safe.`
            });

            // Update copy
            const idx1 = destinationsCopy.indexOf(item1);
            if (idx1 !== -1) destinationsCopy.splice(idx1, 1);
            const idx2 = destinationsCopy.indexOf(item2);
            if (idx2 !== -1) destinationsCopy.splice(idx2, 1);
          } else {
            const item1 = outdoorAttractions.shift() || indoorAttractions.shift() || "Scenic Walking Tour";
            const item2 = outdoorAttractions.shift() || indoorAttractions.shift() || "Panoramic Viewpoint Visit";
            
            daySchedule.push({
              time: "09:30 AM",
              activity: item1,
              note: `Sunny conditions are perfect for outdoor exploring. UV indices are safe during morning slots.`
            });
            daySchedule.push({
              time: "03:30 PM",
              activity: item2,
              note: `Pleasant evening temperatures make it ideal for panoramic views or photography.`
            });

            // Update copy
            const idx1 = destinationsCopy.indexOf(item1);
            if (idx1 !== -1) destinationsCopy.splice(idx1, 1);
            const idx2 = destinationsCopy.indexOf(item2);
            if (idx2 !== -1) destinationsCopy.splice(idx2, 1);
          }

          let packingTip = "Carry light clothing and comfortable walking shoes.";
          if (isRainy) {
            packingTip = "Bring a windproof umbrella, rain jacket, and water-resistant boots.";
          } else if (tempVal > 28) {
            packingTip = "Apply high-rating sun protection (SPF 50), carry polar sunglasses, and keep hydrated.";
          } else if (tempVal < 15) {
            packingTip = "Layer up with a warm wool coat, light fleece sweater, and wind-cheater.";
          }

          generatedDays.push({
            dayName,
            weather: {
              temp: tempVal,
              cond: condText
            },
            schedule: daySchedule,
            packingTip
          });
        }

        setPlannedItinerary(generatedDays);
        setIsGeneratingItinerary(false);
      }
    }, 200);
  };

  // Export actions
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trips, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "weathermind_trips.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,City,Country,Dates,Snapshot,Info\n";
    trips.forEach(t => {
      const row = `"${t.id}","${t.city}","${t.country}","${t.dates}","${t.tempSnapshot}","${t.info}"`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", "weathermind_trips.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrintPDF = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/trips/export/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "weathermind_trips.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn("Could not export PDF from backend, falling back to print", err);
      window.print();
    }
  };

  // Helper to dynamically calculate weather suitability and rank attractions
  const getRankedPlaces = () => {
    const places = selectedCity.places || [];
    const skyType = selectedCity.skyType as string;
    const temp = selectedCity.temp;

    return places.map(place => {
      let suitability = 75; // baseline
      let recommendation = "";
      let placeWeather = "";
      let placeTemp = temp; // baseline city temp

      const nameLower = place.name.toLowerCase();
      const isBeach = nameLower.includes("beach") || nameLower.includes("coast") || nameLower.includes("lake") || nameLower.includes("seine") || nameLower.includes("bosphorus");
      const isTemple = nameLower.includes("temple") || nameLower.includes("shrine") || nameLower.includes("kirkja") || nameLower.includes("sophia") || nameLower.includes("church") || nameLower.includes("mosque");
      const isOutdoor = nameLower.includes("park") || nameLower.includes("sanctuary") || nameLower.includes("forest") || nameLower.includes("garden") || nameLower.includes("tower") || nameLower.includes("square") || nameLower.includes("crossing") || isTemple;
      const isIndoor = nameLower.includes("museum") || nameLower.includes("hall") || nameLower.includes("gallery") || nameLower.includes("dome") || nameLower.includes("bazaar") || nameLower.includes("perlan");

      if (skyType === "clear" || skyType === "sun") {
        placeWeather = "Sunny";
        if (nameLower.includes("coringa")) {
          suitability = 98;
          recommendation = "Perfect for nature walks today";
          placeTemp = 27;
        } else if (nameLower.includes("ntr beach")) {
          suitability = 96;
          recommendation = "Ideal sunset weather";
          placeTemp = 29;
        } else if (nameLower.includes("annavaram")) {
          suitability = 94;
          recommendation = "Pleasant outdoor conditions";
          placeTemp = 26;
        } else if (isBeach) {
          suitability = 96;
          recommendation = "Ideal sunset weather & scenery.";
          placeTemp = temp + 1;
        } else if (isTemple) {
          suitability = 92;
          recommendation = "Pleasant outdoor conditions at historic site.";
          placeTemp = temp - 1;
        } else if (isOutdoor) {
          suitability = 94;
          recommendation = "Perfect for nature walks today.";
          placeTemp = temp - 1;
        } else if (isIndoor) {
          suitability = 88;
          recommendation = "Cool indoor escape from the sunshine.";
        } else {
          suitability = 85;
          recommendation = "Pleasant conditions to explore today.";
        }
      } else if (skyType === "cloud" || skyType === "overcast" || skyType === "haze") {
        placeWeather = "Cloudy";
        if (nameLower.includes("coringa")) {
          suitability = 92;
          recommendation = "Perfect for nature walks today";
          placeTemp = 27;
        } else if (nameLower.includes("ntr beach")) {
          suitability = 85;
          recommendation = "Ideal sunset weather";
          placeTemp = 29;
        } else if (nameLower.includes("annavaram")) {
          suitability = 88;
          recommendation = "Pleasant outdoor conditions";
          placeTemp = 26;
        } else if (isTemple) {
          suitability = 88;
          recommendation = "Pleasant outdoor conditions; soft overcast lighting.";
          placeTemp = temp - 1;
        } else if (isOutdoor) {
          suitability = 85;
          recommendation = "Comfortable outdoor walking today.";
          placeTemp = temp - 1;
        } else if (isIndoor) {
          suitability = 92;
          recommendation = "Perfect day to visit exhibits & stay comfortable.";
        } else {
          suitability = 80;
          recommendation = "Comfortable conditions for visiting today.";
        }
      } else { // rain or heavy-rain
        placeWeather = "Rainy";
        if (isIndoor) {
          suitability = 92;
          recommendation = "Highly recommended cozy indoor experience today.";
          placeTemp = temp - 2;
        } else if (isBeach) {
          suitability = 15;
          recommendation = "Strong winds & rain. Beach activities not advised.";
          placeTemp = temp - 1;
        } else if (isTemple) {
          suitability = 65;
          recommendation = "Indoor halls are open; carry an umbrella.";
          placeTemp = temp - 2;
        } else {
          suitability = 35;
          recommendation = "Wet conditions. Outdoor walking not recommended.";
          placeTemp = temp - 1;
        }
      }

      return {
        ...place,
        suitability,
        recommendation,
        weather: placeWeather,
        temp: placeTemp
      };
    }).sort((a, b) => b.suitability - a.suitability); // Rank by suitability!
  };

  // Dynamic sky styles
  const skyGradients = {
    haze: "linear-gradient(180deg,#3A5470 0%,#26384C 38%,#172430 68%,#0E1620 100%)",
    clear: "linear-gradient(180deg,#4A7A96 0%,#294F66 38%,#1A3445 68%,#0F202B 100%)",
    overcast: "linear-gradient(180deg,#5A6A78 0%,#3B4752 38%,#252F38 68%,#161E24 100%)",
    rain: "linear-gradient(180deg,#344454 0%,#212D38 38%,#141C24 68%,#0C1217 100%)",
    "heavy-rain": "linear-gradient(180deg,#344454 0%,#212D38 38%,#141C24 68%,#0C1217 100%)"
  };

  const nightGradients = {
    clear: "linear-gradient(180deg,#0B1021 0%,#050814 50%,#010206 100%)",
    haze: "linear-gradient(180deg,#161B29 0%,#0F121C 50%,#07080E 100%)",
    overcast: "linear-gradient(180deg,#1C2230 0%,#131722 50%,#0A0C12 100%)",
    rain: "linear-gradient(180deg,#121620 0%,#0B0D14 50%,#05060A 100%)",
    "heavy-rain": "linear-gradient(180deg,#0D1017 0%,#07080B 50%,#020305 100%)"
  };

  const getLocalHour = () => {
    if (!localTime || localTime === "—") return 12; // default to noon
    const match = localTime.match(/^(\d{2}):/);
    if (!match) return 12;
    return parseInt(match[1], 10);
  };
  const localHour = getLocalHour();
  const isSunrise = localHour >= 6 && localHour < 8;
  const isSunset = localHour >= 17 && localHour < 19;

  const isNight = localHour >= 19 || localHour < 6;

  const activeGradient = isNight
    ? (nightGradients[selectedCity.skyType] || nightGradients.clear)
    : (skyGradients[selectedCity.skyType] || skyGradients.haze);

  return (
    <>
      <h2 className="sr-only">
        WeatherMind — travel weather companion showing {selectedCity.city}&apos;s current conditions as a live animated sky, a five-day outlook, trip intelligence, and saved trips.
      </h2>

      {/* NAV */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-8 py-6 flex items-center justify-between pointer-events-auto print:hidden">
        <a href="#" className="font-display text-[1.1rem] font-medium text-paper tracking-[0.01em] no-underline flex items-center gap-2">
          <span className="w-[6px] h-[6px] rounded-full bg-gold inline-block" aria-hidden="true"></span>
          WeatherMind <span className="text-[0.78rem] text-paper-dim font-light">by Guna Teja</span>
        </a>
        <a href="#trips" className="font-body text-[0.85rem] font-medium text-paper-dim no-underline px-[0.9rem] py-[0.45rem] rounded-full transition-all duration-200 border border-paper/18 hover:text-paper hover:border-paper/40 focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2">
          My Trips
        </a>
      </nav>

      {/* HERO SKY */}
      <section 
        className="relative min-h-screen overflow-hidden flex flex-col transition-all duration-700 ease-in-out print:min-h-0 print:py-8 print:bg-none print:text-ink" 
        style={{ background: activeGradient }}
        aria-label={`Current weather for ${selectedCity.city}, ${selectedCity.country}`}
      >
        <div className="absolute inset-0 pointer-events-none print:hidden" aria-hidden="true">
          <WeatherScene
            skyType={selectedCity.skyType}
            condition={selectedCity.condition}
            temp={selectedCity.temp}
            wind={selectedCity.wind}
            localHour={localHour}
          />

          {/* Skyline Silhouette */}
          <div className="absolute bottom-0 left-0 right-0 leading-[0]">
            <svg viewBox="0 0 1180 140" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
              <path d="M0 140 L0 96 L18 96 L18 78 L30 78 L30 96 L52 96 L52 60 L60 50 L68 60 L68 96 L96 96 L96 70 L110 70 L110 96 L140 96 L140 40 L150 40 L150 30 L160 30 L160 40 L170 40 L170 96 L200 96 L200 110 L196 110 L196 130 L260 130 L260 100 L270 100 L270 84 L278 84 L278 100 L300 100 L300 70 L312 58 L324 70 L324 100 L360 100 L360 50 L368 50 L368 38 L378 38 L378 50 L386 50 L386 100 L420 100 L420 116 L450 116 L450 90 L458 78 L466 90 L466 116 L520 116 L520 80 L530 80 L530 60 L540 60 L540 80 L550 80 L550 116 L600 116 L600 96 L612 96 L612 70 L624 70 L624 96 L636 96 L636 116 L680 116 L680 60 L690 60 L690 44 L700 44 L700 60 L710 60 L710 116 L760 116 L760 100 L770 88 L780 100 L780 116 L830 116 L830 70 L842 70 L842 50 L854 50 L854 70 L866 70 L866 116 L900 116 L900 130 L920 130 L920 96 L930 96 L930 80 L940 80 L940 96 L950 96 L950 130 L1000 130 L1000 90 L1010 90 L1010 70 L1022 70 L1022 90 L1034 90 L1034 130 L1080 130 L1080 100 L1090 100 L1090 80 L1100 80 L1100 100 L1110 100 L1110 130 L1180 130 L1180 140 Z" fill="#0E1620"/>
            </svg>
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="relative z-10 flex-1 flex flex-col justify-end px-8 pb-10 max-w-[1180px] mx-auto w-full print:p-0">
          {/* Helper label explaining custom search capability */}
          <div className={`mb-2 text-[0.82rem] tracking-[0.01em] print:hidden ${(isSunrise || isSunset) ? "text-ink/80 font-semibold" : "text-gold/80 font-medium"}`}>
            Enter city, town, zip/postal code, landmark, or GPS coordinates (lat, lon)
          </div>
          <div className="flex items-center gap-[0.65rem] mb-[2rem] max-w-[500px] w-full relative z-30 print:hidden" ref={searchContainerRef}>
            <div className="relative flex-1">
              <input
                type="text"
                className={(isSunrise || isSunset)
                  ? "bg-ink/6 border border-ink/14 rounded-full text-ink font-body text-[0.92rem] px-[1.3rem] py-[0.7rem] w-full outline-none backdrop-blur-[6px] transition-all duration-200 placeholder:text-ink/45 focus:border-ink/30 focus:bg-ink/10 disabled:opacity-50"
                  : "bg-white/8 border border-white/16 rounded-full text-paper font-body text-[0.92rem] px-[1.3rem] py-[0.7rem] w-full outline-none backdrop-blur-[6px] transition-all duration-200 placeholder:text-paper-faint focus:border-gold/60 focus:bg-white/12 disabled:opacity-50"
                }
                placeholder={isLoadingWeather ? "AI Intelligence loading..." : "Search e.g. Eiffel Tower, 90210, 40.71, -74.01..."}
                aria-label="Search for a location"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                disabled={isLoadingWeather}
              />
              {/* Autocomplete Dropdown */}
              {showSuggestions && (
                <div className="absolute top-[110%] left-0 right-0 bg-ink/95 border border-white/12 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md z-50">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item) => (
                      <button
                        key={item.city}
                        className="w-full text-left px-4 py-3 text-paper hover:bg-white/10 border-b border-white/5 last:border-b-0 text-[0.88rem] transition-colors"
                        onMouseDown={() => {
                          setSearchQuery(item.city);
                          handleSearchSubmit(item.city);
                        }}
                      >
                        <span className="font-semibold">{item.city}</span>, <span className="text-paper-dim text-[0.8rem]">{item.country}</span>
                      </button>
                    ))
                  ) : (
                    <button
                      className="w-full text-left px-4 py-3 text-gold hover:bg-white/10 text-[0.88rem] transition-colors"
                      onMouseDown={() => handleSearchSubmit(searchQuery)}
                    >
                      Search custom city &ldquo;<span className="font-semibold">{searchQuery}</span>&rdquo;
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearchSubmit(searchQuery)}
              disabled={isLoadingWeather}
              className={`flex-shrink-0 px-5 py-[0.7rem] rounded-full disabled:cursor-not-allowed font-semibold text-[0.88rem] cursor-pointer transition-all duration-200 flex items-center gap-1.5 ${
                (isSunrise || isSunset)
                  ? "bg-ink text-paper hover:bg-ink/85 disabled:bg-ink/50 focus-visible:outline-ink"
                  : "bg-gold text-ink hover:bg-amber-400 disabled:bg-gold/50 focus-visible:outline-gold"
              } focus-visible:outline-2 focus-visible:outline-offset-2`}
              aria-label="Submit Search"
            >
              {isLoadingWeather && (
                <svg className={`animate-spin h-3.5 w-3.5 ${(isSunrise || isSunset) ? "text-paper" : "text-ink"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoadingWeather ? "Searching..." : "Search"}
            </button>
            <button
              onClick={handleGeolocation}
              disabled={isLoadingWeather}
              className={`flex-shrink-0 w-[38px] h-[38px] rounded-full cursor-pointer flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                (isSunrise || isSunset)
                  ? "bg-ink/6 border border-ink/14 text-ink/70 hover:bg-ink/12 hover:text-ink focus-visible:outline-ink"
                  : "bg-white/8 border border-white/16 text-paper-dim hover:bg-white/15 hover:text-paper focus-visible:outline-gold"
              } focus-visible:outline-2 focus-visible:outline-offset-2`}
              aria-label="Use my current location"
            >
              {isLoadingWeather ? (
                <svg className={`animate-spin h-3.5 w-3.5 ${(isSunrise || isSunset) ? "text-ink" : "text-paper"}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* Global Error Banner */}
          {globalError && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 mb-4 max-w-[500px] backdrop-blur-[4px] text-red-200 text-[0.85rem] flex items-center gap-2 print:hidden animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 text-red-300"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{globalError}</span>
            </div>
          )}

          {isLoadingWeather ? (
            <div className="py-12 flex flex-col items-start justify-center gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin"></span>
                <span className={`font-body text-[0.95rem] font-medium tracking-[0.02em] ${(isSunrise || isSunset) ? "text-[#8F4F00]" : "text-gold"}`}>Querying WeatherMind AI...</span>
              </div>
              <div className="font-display text-[2rem] font-light text-paper/85 leading-tight max-w-[600px]">
                Analyzing historical weather anomalies and generating packing intelligence...
              </div>
            </div>
          ) : (
            <>
              <div className={`font-body text-[0.95rem] font-medium tracking-[0.02em] mb-2 ${(isSunrise || isSunset) ? "text-[#8F4F00]" : "text-gold"} print:text-gold-deep`}>{selectedCity.condition}</div>
              <div className="flex items-end gap-[1.75rem] flex-wrap mb-[1.1rem]">
                <div className="font-display text-[clamp(5.5rem,14vw,9.5rem)] font-light leading-[0.85] text-paper tracking-[-0.02em] print:text-ink">
                  {selectedCity.temp}<sup className="text-[0.35em] font-light relative top-[-0.5em]">°</sup>
                </div>
                <div className="pb-[1.2rem]">
                  <div className="font-display text-[1.5rem] font-medium text-paper mb-[0.3rem] print:text-ink flex items-center gap-2">
                    <span>
                      {selectedCity.skyType === "clear" && "☀️"}
                      {selectedCity.skyType === "haze" && "🌫️"}
                      {selectedCity.skyType === "overcast" && "☁️"}
                      {selectedCity.skyType === "rain" && "🌧️"}
                      {selectedCity.skyType === "heavy-rain" && "⛈️"}
                    </span>
                    <span>{selectedCity.city}, {selectedCity.country}</span>
                  </div>
                  <div className="font-body text-[0.85rem] text-paper-dim print:text-slate">
                    Feels like {selectedCity.feelsLike}° · H:{selectedCity.high}° L:{selectedCity.low}°
                  </div>
                </div>
              </div>

              <div className="flex gap-[2.25rem] flex-wrap py-[1.4rem] border-t border-white/14 mt-2 max-sm:gap-x-[1.8rem] max-sm:gap-y-[1.4rem] print:border-ink/10 print:text-ink" role="list" aria-label="Current conditions">
                <div className="flex flex-col gap-1" role="listitem">
                  <span className="font-body text-[0.7rem] font-medium uppercase tracking-[0.08em] text-paper-faint print:text-slate">Wind</span>
                  <span className="font-body text-[0.95rem] font-medium text-paper print:text-ink">{selectedCity.wind}</span>
                </div>
                <div className="flex flex-col gap-1" role="listitem">
                  <span className="font-body text-[0.7rem] font-medium uppercase tracking-[0.08em] text-paper-faint print:text-slate">Humidity</span>
                  <span className="font-body text-[0.95rem] font-medium text-paper print:text-ink">{selectedCity.humidity}%</span>
                </div>
                <div className="flex flex-col gap-1" role="listitem">
                  <span className="font-body text-[0.7rem] font-medium uppercase tracking-[0.08em] text-paper-faint print:text-slate">UV index</span>
                  <span className="font-body text-[0.95rem] font-medium text-paper print:text-ink">{selectedCity.uvIndex} of 11</span>
                </div>
                <div className="flex flex-col gap-1" role="listitem">
                  <span className="font-body text-[0.7rem] font-medium uppercase tracking-[0.08em] text-paper-faint print:text-slate">Sunset</span>
                  <span className="font-body text-[0.95rem] font-medium text-paper print:text-ink">{selectedCity.sunset}</span>
                </div>
                <div className="flex flex-col gap-1" role="listitem">
                  <span className="font-body text-[0.7rem] font-medium uppercase tracking-[0.08em] text-paper-faint print:text-slate">Local time</span>
                  <span className="font-body text-[0.95rem] font-medium text-paper print:text-ink" id="local-time">{localTime}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ADVISORY */}
      <div className="bg-ink px-8 py-4 print:hidden" role="status">
        <div className="max-w-[1180px] mx-auto flex items-center gap-[0.9rem]">
          <span className="flex-shrink-0 text-gold" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <p className="font-body text-[0.88rem] text-paper/85 leading-normal">
            {selectedCity.advisory.includes("Istanbul") ? (
              <>This week is running <strong className="text-gold font-semibold">40% wetter</strong> than Istanbul&apos;s five-year average — pack a rain shell and build buffer into outdoor plans for Friday and Saturday.</>
            ) : (
              selectedCity.advisory
            )}
          </p>
        </div>
      </div>

      <main className="max-w-[1180px] mx-auto px-8 py-14 pb-8 print:p-0">
        {/* 5 DAY */}
        <section aria-labelledby="forecast-heading">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-[1.4rem] font-medium text-ink" id="forecast-heading">Five-day outlook</h2>
            <span className="font-body text-[0.82rem] text-slate">Updated 12 minutes ago</span>
          </div>

          <div className="grid grid-cols-5 gap-[1.1rem] mb-14 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-2 print:grid print:grid-cols-5 print:gap-4" role="list" aria-label="Five day weather forecast">
            {selectedCity.forecast.map((f, i) => {
              const showRain = f.skyType === "rain" || f.skyType === "heavy-rain";
              const showSunSparkles = f.skyType === "clear" || f.skyType === "sun";
              const showClouds = f.skyType === "cloud" || f.skyType === "sun" || f.skyType === "rain" || f.skyType === "heavy-rain";
              const showLightning = f.skyType === "heavy-rain";

              return (
                <div
                  key={i}
                  className={`bg-[#0A0D14]/95 border border-white/[0.07] rounded-[28px] p-5 relative overflow-hidden min-h-[224px] flex flex-col justify-between cursor-default shadow-xl transition-all duration-300 ease-out hover:-translate-y-[6px] hover:border-white/[0.15] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)] max-md:min-w-[140px] max-md:snap-start print:min-h-0 print:border print:border-card-line print:bg-none print:text-ink ${i === 0 ? "ring-[2px] ring-gold/45 shadow-[0_0_24px_rgba(232,184,109,0.1)] scale-[1.01] z-10 print:ring-0 print:shadow-none print:scale-100" : ""}`}
                  role="listitem"
                  tabIndex={0}
                >
                  {/* Rain drops animation */}
                  {showRain && isMounted && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden z-10" aria-hidden="true">
                      {[
                        { left: "10%", height: "8px", duration: "1.0s", delay: "-0.2s" },
                        { left: "30%", height: "12px", duration: "0.8s", delay: "-0.5s" },
                        { left: "50%", height: "7px", duration: "1.2s", delay: "-0.1s" },
                        { left: "70%", height: "10px", duration: "0.9s", delay: "-0.7s" },
                        { left: "90%", height: "6px", duration: "1.1s", delay: "-0.4s" },
                        { left: "20%", height: "9px", duration: "0.9s", delay: "-0.3s" },
                        { left: "60%", height: "11px", duration: "1.0s", delay: "-0.8s" },
                        { left: "80%", height: "8px", duration: "0.7s", delay: "-0.6s" }
                      ].map((drop, idx) => (
                        <div
                          key={idx}
                          className="mini-drop"
                          style={{
                            left: drop.left,
                            height: drop.height,
                            animationDuration: drop.duration,
                            animationDelay: drop.delay,
                            opacity: "0.4"
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Sun sparkles animation */}
                  {showSunSparkles && isMounted && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden z-10" aria-hidden="true">
                      <div className="sun-sparkle" style={{ left: "15%", width: "10px", height: "10px", animationDelay: "0s", animationDuration: "4s" }} />
                      <div className="sun-sparkle" style={{ left: "45%", width: "7px", height: "7px", animationDelay: "1.2s", animationDuration: "5s" }} />
                      <div className="sun-sparkle" style={{ left: "75%", width: "12px", height: "12px", animationDelay: "2.5s", animationDuration: "3.5s" }} />
                    </div>
                  )}

                  {/* SVG Drifting Clouds animation */}
                  {showClouds && isMounted && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden opacity-[0.09] z-10" aria-hidden="true">
                      <svg viewBox="0 0 100 60" className="card-cloud-svg-1 absolute w-[60px] h-auto text-white fill-current">
                        <path d="M20 45h60 a15 15 0 0 0 0-30 a14.8 14.8 0 0 0-3.3.4 A25 25 0 0 0 30 20 a24.8 24.8 0 0 0 .5 5 A18 18 0 0 0 20 45 z" />
                      </svg>
                      <svg viewBox="0 0 100 60" className="card-cloud-svg-2 absolute w-[80px] h-auto text-white fill-current">
                        <path d="M20 45h60 a15 15 0 0 0 0-30 a14.8 14.8 0 0 0-3.3.4 A25 25 0 0 0 30 20 a24.8 24.8 0 0 0 .5 5 A18 18 0 0 0 20 45 z" />
                      </svg>
                    </div>
                  )}

                  {/* Storm lightning flash animation */}
                  {showLightning && isMounted && (
                    <div className="lightning-flash z-10" />
                  )}

                  {/* Top Row: Temperature on Left, Day + Condition on Right */}
                  <div className="flex justify-between items-start w-full relative z-20">
                    <div className="font-display text-[2.3rem] font-light text-white tracking-tight leading-none">
                      {f.tempHigh}°
                    </div>
                    
                    <div className="flex flex-col items-end text-right">
                      <span className="text-[0.7rem] font-bold text-white/40 uppercase tracking-wider leading-none">
                        {i === 0 ? "Today" : f.day}
                      </span>
                      <span className="text-[0.76rem] text-white/80 font-medium leading-tight mt-1 max-w-[85px]">
                        {f.condition}
                      </span>
                      {i === 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="bg-white/12 text-gold text-[0.52rem] font-extrabold uppercase px-2 py-0.5 rounded-full border border-white/10 tracking-wider shadow-sm animate-pulse">
                            Active
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Row: Large Gradient Weather Icon with ambient glow */}
                  <div className="flex-1 flex items-center justify-center py-2 relative my-1 z-20">
                    {f.skyType === "sun" && <div className="absolute w-12 h-12 rounded-full bg-amber-500/10 blur-xl animate-pulse" />}
                    {f.skyType === "clear" && <div className="absolute w-12 h-12 rounded-full bg-sky-500/10 blur-xl animate-pulse" />}
                    {f.skyType === "cloud" && <div className="absolute w-12 h-12 rounded-full bg-slate-500/10 blur-xl" />}
                    {f.skyType === "rain" && <div className="absolute w-12 h-12 rounded-full bg-blue-500/10 blur-xl" />}
                    {f.skyType === "heavy-rain" && <div className="absolute w-12 h-12 rounded-full bg-indigo-500/15 blur-xl" />}

                    <span className="relative z-10 w-16 h-16 flex items-center justify-center" aria-hidden="true">
                      {f.skyType === "sun" && (
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FFF5C0" />
                              <stop offset="100%" stopColor="#EAB308" />
                            </linearGradient>
                            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#E2E8F0" />
                              <stop offset="100%" stopColor="#94A3B8" />
                            </linearGradient>
                          </defs>
                          <circle cx="15" cy="9" r="4" fill="url(#sunGrad)" stroke="url(#sunGrad)" />
                          <path d="M18 13h-1.26A8 8 0 1 0 9 23h9a5 5 0 0 0 0-10z" fill="url(#cloudGrad)" stroke="url(#cloudGrad)" />
                        </svg>
                      )}
                      {f.skyType === "cloud" && (
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="cloudDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#94A3B8" />
                              <stop offset="100%" stopColor="#475569" />
                            </linearGradient>
                          </defs>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="url(#cloudDarkGrad)" stroke="url(#cloudDarkGrad)" />
                        </svg>
                      )}
                      {f.skyType === "rain" && (
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#64748B" />
                              <stop offset="100%" stopColor="#334155" />
                            </linearGradient>
                          </defs>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="url(#rainCloudGrad)" stroke="url(#rainCloudGrad)" />
                          <path d="M7 21l-1 2M11 21l-1 2M15 21l-1 2" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                      )}
                      {f.skyType === "heavy-rain" && (
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="stormCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#475569" />
                              <stop offset="100%" stopColor="#1E293B" />
                            </linearGradient>
                          </defs>
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="url(#stormCloudGrad)" stroke="url(#stormCloudGrad)" />
                          <path d="M13 18l-2 4h3l-1 4" stroke="#FACC15" fill="#FACC15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {f.skyType === "clear" && (
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="url(#clearSunGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <defs>
                            <linearGradient id="clearSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#FFF3B0" />
                              <stop offset="100%" stopColor="#CA8A04" />
                            </linearGradient>
                          </defs>
                          <circle cx="12" cy="12" r="5" fill="url(#clearSunGrad)" />
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                        </svg>
                      )}
                    </span>
                  </div>

                  {/* Bottom Row: High / Low Columns divided by vertical line */}
                  <div className="grid grid-cols-2 divide-x divide-white/[0.08] w-full text-center relative z-20 pt-2 border-t border-white/[0.05]">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[0.55rem] font-bold text-white/30 uppercase tracking-widest leading-none">High</span>
                      <span className="text-[0.95rem] font-semibold text-white mt-0.5 leading-none">{f.tempHigh}°</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[0.55rem] font-bold text-white/30 uppercase tracking-widest leading-none">Low</span>
                      <span className="text-[0.95rem] font-semibold text-white/70 mt-0.5 leading-none">{f.tempLow}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-none border-t border-card-line mb-14" />

        {/* TRIP INTELLIGENCE */}
        <section aria-labelledby="intel-heading">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-[1.4rem] font-medium text-ink" id="intel-heading">Trip intelligence</h2>
            <span className="font-body text-[0.82rem] text-slate">For your {selectedCity.city} dates</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-14 max-md:grid-cols-1">
            <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#5BA876] flex-shrink-0" aria-hidden="true"></span>
                  Packing note
                </div>
                <p className="font-body text-[0.92rem] text-ink leading-relaxed">
                  {selectedCity.packingNote}
                </p>
              </div>
            </div>

            <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">
                  <span className="w-[7px] h-[7px] rounded-full bg-[#5BA876] flex-shrink-0" aria-hidden="true"></span>
                  Air quality &amp; health
                </div>
                <p className="font-body text-[0.92rem] text-ink leading-relaxed">
                  {selectedCity.healthNote}
                </p>
              </div>
            </div>

            {/* Google Map Card */}
            <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] flex flex-col justify-between col-span-2 max-md:col-span-1">
              <div>
                <div className="font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">Interactive Map</div>
                <div className="rounded-[12px] overflow-hidden border border-card-line bg-[#E5E3DF] relative h-[140px] w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedCity.city + ", " + selectedCity.country)}&t=&z=11&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 w-full h-full block"
                  ></iframe>
                </div>
              </div>
            </div>

            {/* YouTube Travel Videos Card */}
            {ytVideos.length > 0 && (
              <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] col-span-2 max-md:col-span-1 print:hidden">
                <div className="font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">
                  Local Travel Guides &amp; Videos
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 max-sm:grid-cols-1">
                  {ytVideos.map((video, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveVideoId(video.videoId)}
                      className="text-left bg-black/5 hover:bg-black/10 border border-card-line/50 hover:border-ink/20 rounded-[12px] p-2.5 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full group"
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden relative mb-2 bg-slate/10">
                        <Image
                          src={video.thumbnail}
                          alt={video.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="w-full h-full object-cover transition-transform duration-350 ease-out group-hover:scale-104"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                          </div>
                        </div>
                      </div>
                      <div className="font-body text-[0.78rem] font-medium text-ink line-clamp-2 leading-snug group-hover:text-gold-deep transition-colors" dangerouslySetInnerHTML={{ __html: video.title }}></div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <hr className="border-none border-t border-card-line mb-14" />

        {/* Recommended Places for Today's Weather */}
        <section aria-labelledby="worth-visiting-heading" className="mb-14 bg-white/80 backdrop-blur-md border border-white/20 rounded-[28px] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
            <div>
              <h2 className="font-display text-[1.4rem] font-semibold text-ink" id="worth-visiting-heading">
                Recommended Places for Today&apos;s Weather
              </h2>
              <p className="font-body text-[0.82rem] text-slate mt-1">
                Dynamic suitability insights similar to Apple Weather and Airbnb
              </p>
            </div>
          </div>

          {getRankedPlaces().length === 0 ? (
            <div className="text-center py-14 bg-white/40 backdrop-blur-lg border border-white/20 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
              <span className="text-3xl block mb-2" role="img" aria-label="pin">📍</span>
              <p className="font-body text-[0.92rem] text-slate font-medium">No major tourist attractions found for this location.</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {getRankedPlaces().map((place, idx) => {
                const badgeColors =
                  place.suitability >= 90
                    ? "text-emerald-600"
                    : place.suitability >= 70
                    ? "text-amber-600"
                    : "text-rose-600";

                return (
                  <div
                    key={idx}
                    className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white/60 backdrop-blur-lg border border-white/30 rounded-[20px] overflow-hidden flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.015)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)] group"
                  >
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate/10">
                      <Image
                        src={place.image.replace("w=300&h=220", "w=450&h=300")}
                        alt={place.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 350px"
                        className="w-full h-full object-cover block transition-transform duration-500 ease-out group-hover:scale-105"
                        unoptimized
                      />
                      {/* Glassmorphic suitability score badge */}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-[0.72rem] font-bold bg-white/85 backdrop-blur-md shadow-sm border border-white/50 ${badgeColors}`}>
                          {place.suitability}% Suitability
                        </span>
                      </div>
                      {/* Glassmorphic temperature and small weather icon overlay */}
                      <div className="absolute top-3 right-3">
                        <span className="bg-black/45 backdrop-blur-md text-white text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-full border border-white/10 shadow-sm flex items-center gap-1.5">
                          {place.weather === "Sunny" && (
                            <svg className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="5" />
                              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                          )}
                          {place.weather === "Cloudy" && (
                            <svg className="w-3.5 h-3.5 text-slate-200 fill-slate-200" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                            </svg>
                          )}
                          {place.weather === "Rainy" && (
                            <svg className="w-3.5 h-3.5 text-blue-300 fill-blue-300/30" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
                              <path d="M8 19v2M12 19v2M16 19v2" />
                            </svg>
                          )}
                          {place.temp}°C
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display text-[1.12rem] font-semibold text-ink mb-1 group-hover:text-gold-deep transition-colors">
                          {place.name}
                        </h3>
                        <span className="text-[0.62rem] font-bold text-slate/50 uppercase tracking-wider mb-2 block">
                          AI Recommendation
                        </span>
                        <p className="font-body text-[0.88rem] text-slate leading-relaxed mb-5">
                          {place.recommendation}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedPlace(place)}
                        className="w-full py-2 bg-ink text-paper hover:bg-[#2B333D] rounded-xl font-semibold text-[0.82rem] text-center transition-all duration-200 shadow-sm hover:shadow border-none cursor-pointer flex items-center justify-center gap-1"
                      >
                        View Weather Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <hr className="border-none border-t border-card-line mb-14" />

        {/* HISTORICAL WEATHER VAULT */}
        <section aria-labelledby="history-vault-heading" className="mb-14">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-[1.4rem] font-medium text-ink" id="history-vault-heading">
              Historical Weather Vault
            </h2>
            <span className="font-body text-[0.82rem] text-slate">Analyze historical temperature ranges</span>
          </div>

          <div className="bg-card border border-card-line rounded-[18px] p-6">
            <form onSubmit={handleHistoricalQuery} className="grid grid-cols-4 gap-4 items-end max-md:grid-cols-1">
              <div>
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 90210, Tokyo, 40.71, -74.01"
                  value={histCity}
                  onChange={(e) => setHistCity(e.target.value)}
                  className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={histStart}
                  onChange={(e) => setHistStart(e.target.value)}
                  className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={histEnd}
                  onChange={(e) => setHistEnd(e.target.value)}
                  className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={histLoading}
                  className="w-full py-[0.6rem] bg-ink text-paper hover:bg-[#2B333D] rounded-lg font-semibold text-[0.88rem] transition-colors disabled:opacity-50"
                >
                  {histLoading ? "Querying..." : "Compare Range"}
                </button>
              </div>
            </form>

            {histError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-[0.85rem] rounded-lg flex items-center gap-2 animate-fade-in">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{histError}</span>
              </div>
            )}

            {histResults && (
              <div className="mt-6 border-t border-card-line pt-6 animate-fade-in">
                <h4 className="font-display text-[1.1rem] font-medium text-ink mb-4">Daily Temperatures for {histCity}</h4>
                <div className="grid grid-cols-7 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
                  {histResults.map((r, idx) => (
                    <div key={idx} className="bg-card-line/30 border border-card-line/50 p-3 rounded-xl text-center">
                      <div className="font-body text-[0.75rem] font-semibold text-slate uppercase">
                        {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="mt-2 font-display text-[1.2rem] font-semibold text-ink">
                        {r.tempMax}°
                      </div>
                      <div className="font-body text-[0.75rem] text-slate">
                        Low: {r.tempMin}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentHistQueries.length > 0 && (
              <div className="mt-6 border-t border-card-line pt-6 animate-fade-in animate-duration-300">
                <h4 className="font-display text-[0.88rem] font-semibold text-ink mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Stored Database Queries (Date Ranges)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {recentHistQueries.map((q: HistoricalQuery) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setHistCity(q.city);
                        setHistStart(q.startDate);
                        setHistEnd(q.endDate);
                        setHistResults(q.results);
                      }}
                      className="text-left bg-white hover:bg-card-line/30 border border-card-line rounded-lg px-3 py-1.5 transition-all duration-200 group flex items-center gap-2 active:scale-95 shadow-sm hover:shadow"
                    >
                      <div>
                        <div className="font-display text-[0.82rem] font-semibold text-ink group-hover:text-gold-deep transition-colors">
                          {q.city}
                        </div>
                        <div className="font-body text-[0.68rem] text-slate">
                          {q.startDate} to {q.endDate}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <hr className="border-none border-t border-card-line mb-14" />

        {/* TRIPS */}
        <section id="trips" aria-labelledby="trips-heading" className="print:mt-8">
          <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
            <h2 className="font-display text-[1.4rem] font-medium text-ink" id="trips-heading">My trips</h2>
            <button
              onClick={handleOpenNewModal}
              className="font-body text-[0.85rem] font-semibold text-paper bg-ink border-none rounded-full px-[1.2rem] py-[0.6rem] cursor-pointer inline-flex items-center gap-1 transition-colors duration-200 hover:bg-[#2B333D] focus-visible:outline-2 focus-visible:outline-gold-deep focus-visible:outline-offset-2 print:hidden"
              aria-label="Add a new trip"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New trip
            </button>
          </div>

          <div className="flex flex-col gap-[0.7rem] mb-[1.4rem]" role="list" aria-label="Saved trips">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <div key={trip.id} className="flex items-center gap-[1.1rem] bg-card border border-card-line rounded-[16px] p-[0.9rem_1.1rem] transition-colors duration-200 hover:border-ink/20 max-sm:flex-wrap" role="listitem">
                  <div
                    className="w-[46px] h-[46px] rounded-[12px] flex-shrink-0 bg-cover bg-center print:border print:border-card-line"
                    style={{ backgroundImage: trip.gradient }}
                    aria-hidden="true"
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[1.02rem] font-medium text-ink">{trip.city}, {trip.country}</div>
                    <div className="font-body text-[0.78rem] text-slate mt-[0.1rem]">{trip.dates}</div>
                  </div>
                  <span className="font-body text-[0.78rem] font-semibold text-gold-deep bg-gold/14 px-[0.65rem] py-[0.3rem] rounded-full whitespace-nowrap flex-shrink-0 max-sm:order-3 max-sm:ml-[62px]">
                    {trip.tempSnapshot} · {trip.info}
                  </span>
                  <div className="flex gap-2 flex-shrink-0 print:hidden">
                    <button
                      onClick={() => handleOpenPlanner(trip)}
                      className="px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[0.78rem] font-semibold cursor-pointer flex items-center gap-1 transition-all duration-200 hover:bg-amber-100 hover:text-amber-800"
                      aria-label={`Plan ${trip.city} itinerary`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      Planner
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(trip.id)}
                      className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[0.78rem] font-semibold cursor-pointer flex items-center gap-1 transition-all duration-200 hover:bg-blue-100 hover:text-blue-800"
                      aria-label={`Edit ${trip.city} trip`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="px-3 py-1.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-[0.78rem] font-semibold cursor-pointer flex items-center gap-1 transition-all duration-200 hover:bg-red-100 hover:text-red-700"
                      aria-label={`Delete ${trip.city} trip`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate font-body text-[0.9rem] bg-card border border-card-line border-dashed rounded-[16px]">
                No upcoming trips saved. Click &ldquo;New trip&rdquo; to plan one.
              </div>
            )}
          </div>

          <div className="flex items-center gap-[0.6rem] flex-wrap print:hidden" role="group" aria-label="Export trip data">
            <span className="font-body text-[0.78rem] font-medium text-slate mr-1">Export</span>
            <button onClick={handleExportJSON} className="font-body text-[0.8rem] font-medium text-ink bg-transparent border border-card-line rounded-full px-[0.85rem] py-1.5 cursor-pointer transition-all duration-200 hover:bg-card hover:border-ink/20 focus-visible:outline-2 focus-visible:outline-gold-deep focus-visible:outline-offset-2">JSON</button>
            <button onClick={handleExportCSV} className="font-body text-[0.8rem] font-medium text-ink bg-transparent border border-card-line rounded-full px-[0.85rem] py-1.5 cursor-pointer transition-all duration-200 hover:bg-card hover:border-ink/20 focus-visible:outline-2 focus-visible:outline-gold-deep focus-visible:outline-offset-2">CSV</button>
            <button onClick={handlePrintPDF} className="font-body text-[0.8rem] font-medium text-ink bg-transparent border border-card-line rounded-full px-[0.85rem] py-1.5 cursor-pointer transition-all duration-200 hover:bg-card hover:border-ink/20 focus-visible:outline-2 focus-visible:outline-gold-deep focus-visible:outline-offset-2">PDF</button>
          </div>
        </section>
      </main>

      <footer className="px-8 py-12 border-t border-card-line print:border-none print:mt-12 print:pt-4">
        <div className="max-w-[1180px] mx-auto">
          <p className="font-body text-[0.82rem] text-slate leading-relaxed max-w-[650px]">
            Designed &amp; Developed by <strong className="font-semibold text-ink">Guna Teja</strong>. Built as part of the PM Accelerator AI Engineer Intern technical assessment. PM Accelerator is a premier educational program and community dedicated to empowering future product managers and AI builders with hands-on experience, career acceleration, and design thinking. WeatherMind is a travel weather companion that pairs real conditions with trip-aware packing and timing notes for places you&apos;re actually going.
          </p>
          <p className="font-display text-[0.85rem] text-ink/35 mt-6 italic print:text-slate">Clear skies ahead.</p>
        </div>
      </footer>

      {/* TRIP SAVE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
          <div className="bg-card border border-card-line rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="font-display text-[1.3rem] font-medium text-ink mb-4">
              {editingTripId ? "Edit trip details" : "Add a new trip"}
            </h3>
            <form onSubmit={handleSaveTrip} className="space-y-4">
              {modalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 text-[0.82rem] rounded-lg flex items-center gap-2 animate-fade-in">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Destination Location</label>
                <input
                  type="text"
                  required
                  disabled={modalSaving}
                  placeholder="e.g. Eiffel Tower, Tokyo, 90210"
                  value={modalCity}
                  onChange={(e) => setModalCity(e.target.value)}
                  className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    disabled={modalSaving}
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    disabled={modalSaving}
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-card-line">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={modalSaving}
                  className="px-4 py-2 rounded-full border border-card-line text-slate hover:bg-black/5 text-[0.85rem] font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  className="px-5 py-2 rounded-full bg-ink text-paper hover:bg-[#2B333D] text-[0.85rem] font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {modalSaving && (
                    <svg className="animate-spin h-3.5 w-3.5 text-paper" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {modalSaving ? "Saving..." : "Save Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLACE DETAILS MODAL */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in" onClick={() => setSelectedPlace(null)}>
          <div 
            className="bg-card border border-card-line rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-[16/10] relative w-full">
              <Image
                src={selectedPlace.image.replace("w=300&h=220", "w=600&h=380")}
                alt={selectedPlace.name}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setSelectedPlace(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors border-none cursor-pointer"
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6">
              <h3 className="font-display text-[1.4rem] font-semibold text-ink mb-2">{selectedPlace.name}</h3>
              <p className="font-body text-[0.9rem] text-slate leading-relaxed">{selectedPlace.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* TRIP PLANNER MODAL */}
      {plannerTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in" onClick={() => {
          if (!isGeneratingItinerary) {
            setPlannerTrip(null);
            setPlannedItinerary(null);
          }
        }}>
          <div 
            className="bg-[#0D111A]/95 border border-white/[0.08] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative text-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="font-display text-[1.3rem] font-medium text-white flex items-center gap-2">
                  <span className="w-[8px] h-[8px] rounded-full bg-gold inline-block"></span>
                  AI Weather-Aware Trip Planner
                </h3>
                <p className="font-body text-[0.82rem] text-slate mt-1">
                  Planning itinerary for <strong className="text-white">{plannerTrip.city}, {plannerTrip.country}</strong> ({plannerTrip.dates})
                </p>
              </div>
              <button 
                onClick={() => {
                  setPlannerTrip(null);
                  setPlannedItinerary(null);
                }}
                disabled={isGeneratingItinerary}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border-none cursor-pointer disabled:opacity-50"
                aria-label="Close planner"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Destinations step (if not planned yet) */}
            {!plannedItinerary && !isGeneratingItinerary && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-display text-[0.95rem] font-semibold text-white/90 mb-2">1. Select/Confirm Places to Visit</h4>
                  <p className="font-body text-[0.82rem] text-slate mb-3">
                    We gathered some top sights in {plannerTrip.city}. Click to toggle them, or add your custom destinations below:
                  </p>
                  
                  {/* Suggestions tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(() => {
                      const dbKey = plannerTrip.city.toLowerCase();
                      const dbCity = CITIES_DB[dbKey as keyof typeof CITIES_DB];
                      const suggestedPlaces = dbCity 
                        ? dbCity.places.map(p => p.name)
                        : [`${plannerTrip.city} Historic Center`, `${plannerTrip.city} Central Park`, `${plannerTrip.city} Local Museum`, `${plannerTrip.city} Botanical Gardens`, `${plannerTrip.city} Scenic Viewpoint`];
                      
                      return suggestedPlaces.map((placeName) => {
                        const isSelected = plannerDestinations.includes(placeName);
                        return (
                          <button
                            key={placeName}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setPlannerDestinations(plannerDestinations.filter(d => d !== placeName));
                              } else {
                                setPlannerDestinations([...plannerDestinations, placeName]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-[0.76rem] font-semibold transition-all duration-200 cursor-pointer border ${
                              isSelected
                                ? "bg-gold text-ink border-gold"
                                : "bg-white/5 border-white/10 text-slate hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "} {placeName}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Custom input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type custom attraction..."
                      value={newDestinationInput}
                      onChange={(e) => setNewDestinationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newDestinationInput.trim() && !plannerDestinations.includes(newDestinationInput.trim())) {
                            setPlannerDestinations([...plannerDestinations, newDestinationInput.trim()]);
                            setNewDestinationInput("");
                          }
                        }
                      }}
                      className="flex-1 bg-white/5 border border-white/12 rounded-lg px-3 py-2 text-white text-[0.88rem] outline-none focus:border-gold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newDestinationInput.trim() && !plannerDestinations.includes(newDestinationInput.trim())) {
                          setPlannerDestinations([...plannerDestinations, newDestinationInput.trim()]);
                          setNewDestinationInput("");
                        }
                      }}
                      className="px-4 py-2 bg-gold text-ink font-semibold rounded-lg text-[0.82rem] hover:bg-gold-deep transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-display text-[0.95rem] font-semibold text-white/90 mb-2">2. Destination Checklist</h4>
                  {plannerDestinations.length === 0 ? (
                    <div className="text-[0.82rem] text-slate italic bg-white/5 p-3 rounded-lg border border-dashed border-white/10">
                      No destinations selected yet. Add or toggle places above.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 bg-white/5 p-3 rounded-lg border border-white/10">
                      {plannerDestinations.map(d => (
                        <span key={d} className="bg-white/10 px-2.5 py-1 rounded-md text-[0.76rem] font-medium flex items-center gap-1.5">
                          {d}
                          <button 
                            type="button" 
                            onClick={() => setPlannerDestinations(plannerDestinations.filter(p => p !== d))}
                            className="text-red-400 hover:text-red-300 font-bold bg-transparent border-none cursor-pointer text-[0.7rem]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setPlannerTrip(null);
                      setPlannedItinerary(null);
                    }}
                    className="px-4 py-2 rounded-full border border-white/10 text-slate hover:bg-white/5 text-[0.85rem] font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateItinerary}
                    disabled={plannerDestinations.length === 0}
                    className="px-5 py-2 rounded-full bg-gold text-ink hover:bg-gold-deep text-[0.85rem] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    Generate Daily Itinerary
                  </button>
                </div>
              </div>
            )}

            {/* Generating animation step */}
            {isGeneratingItinerary && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-gold border-t-transparent animate-spin"></div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold animate-pulse"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <h4 className="font-display text-[1.1rem] font-semibold text-white">WeatherWise AI Engine running...</h4>
                  <p className="font-body text-[0.82rem] text-slate mt-1 max-w-[280px]">
                    {generationProgress < 25 && "Analyzing historical climate trends & indices..."}
                    {generationProgress >= 25 && generationProgress < 50 && "Parsing satellite humidity & cloud layers..."}
                    {generationProgress >= 50 && generationProgress < 75 && "Mapping indoor attractions to rainy intervals..."}
                    {generationProgress >= 75 && "Sequencing optimal route timeline..."}
                  </p>
                </div>
                <div className="w-[200px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gold transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
                </div>
                <span className="text-[0.78rem] text-slate font-medium">{generationProgress}%</span>
              </div>
            )}

            {/* Finished itinerary plan */}
            {plannedItinerary && !isGeneratingItinerary && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gold/14 text-gold flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  </div>
                  <p className="font-body text-[0.82rem] text-slate leading-relaxed">
                    <strong className="text-white">AI Analysis Complete:</strong> We planned your itinerary by aligning selected attractions to the dryest and coolest times of each day, maximizing comfort.
                  </p>
                </div>

                <div className="space-y-4">
                  {plannedItinerary.map((day, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-3">
                      {/* Day title & Weather */}
                      <div className="flex justify-between items-center border-b border-white/8 pb-2">
                        <h4 className="font-display text-[0.92rem] font-semibold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                          Day {idx + 1}: {day.dayName}
                        </h4>
                        <span className="font-body text-[0.76rem] font-semibold text-gold-deep bg-gold/14 px-2 py-0.5 rounded-full border border-gold/10">
                          {day.weather.temp}°C · {day.weather.cond}
                        </span>
                      </div>

                      {/* Attractions sequence */}
                      <div className="space-y-2">
                        {day.schedule.map((item: PlannerScheduleItem, sIdx: number) => (
                          <div key={sIdx} className="flex gap-3 text-[0.82rem] font-body bg-white/5 p-2.5 rounded border border-white/5">
                            <span className="text-gold font-semibold w-[65px] flex-shrink-0">{item.time}</span>
                            <div className="space-y-0.5">
                              <div className="font-semibold text-white">{item.activity}</div>
                              <p className="text-slate text-[0.76rem]">{item.note}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Daily packing advice */}
                      <div className="text-[0.78rem] font-body text-slate flex items-start gap-1.5 mt-2 bg-black/20 p-2 rounded">
                        <span className="text-gold flex-shrink-0">💡 Packing Tip:</span>
                        <span>{day.packingTip}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setPlannedItinerary(null);
                    }}
                    className="px-4 py-2 rounded-full border border-white/10 text-slate hover:bg-white/5 text-[0.85rem] font-medium transition-colors"
                  >
                    Back to Selection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlannerTrip(null);
                      setPlannedItinerary(null);
                    }}
                    className="px-5 py-2 rounded-full bg-gold text-ink hover:bg-gold-deep text-[0.85rem] font-bold transition-all duration-200"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* YOUTUBE VIDEO PLAYER MODAL */}
      {activeVideoId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in" onClick={() => setActiveVideoId(null)}>
          <div 
            className="bg-[#1A1F26] border border-white/10 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveVideoId(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors border-none cursor-pointer z-10"
              aria-label="Close video player"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full block border-none"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
