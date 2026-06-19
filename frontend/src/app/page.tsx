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

interface RainDrop {
  left: string;
  height: string;
  duration: string;
  delay: string;
  opacity: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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

  // Historical query state
  const [histCity, setHistCity] = useState("");
  const [histStart, setHistStart] = useState("");
  const [histEnd, setHistEnd] = useState("");
  const [histResults, setHistResults] = useState<{ date: string; tempMax: number; tempMin: number }[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [recentHistQueries, setRecentHistQueries] = useState<any[]>([]);

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

  // Rain animation states
  const [heroRainDrops, setHeroRainDrops] = useState<RainDrop[]>([]);
  const [miniRainDrops1, setMiniRainDrops1] = useState<RainDrop[]>([]);
  const [miniRainDrops2, setMiniRainDrops2] = useState<RainDrop[]>([]);
  
  // Star animation state for night sky
  const [stars, setStars] = useState<{ left: string; top: string; size: string; delay: string; duration: string }[]>([]);

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
        setLocalTime("—");
      }
    };
    
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  // Rain drop generation on client-side
  useEffect(() => {
    if (!isMounted) return;

    // Generate main rain layer
    const hero = Array.from({ length: 26 }, () => ({
      left: `${Math.random() * 100}%`,
      height: `${8 + Math.random() * 14}px`,
      duration: `${(2.4 + Math.random() * 1.4).toFixed(2)}s`,
      delay: `-${(Math.random() * 2.4).toFixed(2)}s`,
      opacity: `${(0.3 + Math.random() * 0.4).toFixed(2)}`
    }));
    setHeroRainDrops(hero);

    // Mini rain 1
    const mini1 = Array.from({ length: 18 }, () => ({
      left: `${Math.random() * 100}%`,
      height: `${6 + Math.random() * 8}px`,
      duration: `${(0.8 + Math.random() * 0.6).toFixed(2)}s`,
      delay: `-${(Math.random() * 1.2).toFixed(2)}s`,
      opacity: `${(0.4 + Math.random() * 0.4).toFixed(2)}`
    }));
    setMiniRainDrops1(mini1);

    // Mini rain 2
    const mini2 = Array.from({ length: 28 }, () => ({
      left: `${Math.random() * 100}%`,
      height: `${6 + Math.random() * 8}px`,
      duration: `${(0.8 + Math.random() * 0.6).toFixed(2)}s`,
      delay: `-${(Math.random() * 1.2).toFixed(2)}s`,
      opacity: `${(0.4 + Math.random() * 0.4).toFixed(2)}`
    }));
    setMiniRainDrops2(mini2);

    // Generate random stars for the night sky
    const starList = Array.from({ length: 45 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 65}%`,
      size: `${1 + Math.random() * 1.5}px`,
      delay: `${(Math.random() * 5).toFixed(2)}s`,
      duration: `${(2 + Math.random() * 3).toFixed(2)}s`
    }));
    setStars(starList);
  }, [isMounted]);

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
      const errMsg = err instanceof Error ? err.message : `Failed to fetch weather for "${cityName}".`;
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

    if (start > end) {
      setHistError("Start Date must be before or equal to End Date.");
      return;
    }
    if (end > today) {
      setHistError("End Date cannot be in the future for historical lookup.");
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
      setModalStart("");
      setModalEnd("");
      setShowModal(true);
    }
  };

  const handleOpenNewModal = () => {
    setEditingTripId(null);
    setModalCity("");
    setModalStart("");
    setModalEnd("");
    setShowModal(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCity || !modalStart || !modalEnd) return;

    const formattedDates = formatDateRange(modalStart, modalEnd);
    const key = modalCity.toLowerCase().trim();
    
    // First, try fetching the weather details for this city to set swatches
    let weatherRef = CITIES_DB[key];
    if (!weatherRef) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/weather?city=${encodeURIComponent(modalCity)}`);
        if (res.ok) {
          weatherRef = await res.json();
        }
      } catch (err) {
        console.warn("Could not fetch city weather from API, generating fallback", err);
      }
    }
    
    if (!weatherRef) {
      weatherRef = generateCityData(modalCity);
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
    const gradient = gradientMap[weatherRef.skyType] || "linear-gradient(160deg,#5C87A8,#2E4863)";

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
          body: JSON.stringify({ dates: formattedDates })
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

    setShowModal(false);
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

  const getIsNight = () => {
    if (!localTime || localTime === "—") return false;
    const match = localTime.match(/^(\d{2}):/);
    if (!match) return false;
    const hour = parseInt(match[1], 10);
    return hour >= 19 || hour < 6;
  };
  const isNight = getIsNight();

  const activeGradient = isNight
    ? (nightGradients[selectedCity.skyType] || nightGradients.clear)
    : (skyGradients[selectedCity.skyType] || skyGradients.haze);

  const isRainySky = selectedCity.skyType === "rain" || selectedCity.skyType === "heavy-rain" || selectedCity.skyType === "haze";

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
          {/* Twinkling Stars (only visible at night) */}
          {isNight && stars.map((star, idx) => (
            <div
              key={idx}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}

          {/* Sun (only visible in Clear and Haze/Cloudy, and only during day) */}
          {!isNight && (selectedCity.skyType === "clear" || selectedCity.skyType === "haze") && (
            <div className="absolute top-[14%] left-1/2 -translate-x-1/2">
              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-[#FFE7B8] via-[#E8B86D] to-[#C98C4A] animate-sun-breathe"></div>
            </div>
          )}

          {/* Moon (only visible at night) */}
          {isNight && (
            <div className="absolute top-[14%] left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="relative w-[110px] h-[110px] rounded-full bg-[#E5E9F0] animate-moon-glow flex items-center justify-center overflow-hidden">
                {/* Moon craters */}
                <div className="absolute top-[20%] left-[25%] w-[18px] h-[18px] rounded-full bg-black/10"></div>
                <div className="absolute top-[50%] left-[60%] w-[24px] h-[24px] rounded-full bg-black/10"></div>
                <div className="absolute top-[65%] left-[30%] w-[14px] h-[14px] rounded-full bg-black/10"></div>
                <div className="absolute top-[30%] left-[70%] w-[12px] h-[12px] rounded-full bg-black/10"></div>
              </div>
            </div>
          )}

          {/* Clouds */}
          {selectedCity.skyType !== "clear" && (
            <>
              <div className="absolute opacity-80 top-[18%] left-0 w-[240px] animate-drift-1" style={{ animationDelay: "-20s" }}>
                <svg viewBox="0 0 240 90" width="240" height="90">
                  <path 
                    d="M40 70 Q20 70 20 50 Q20 30 42 32 Q46 12 70 14 Q96 -2 116 16 Q140 10 150 30 Q176 28 180 50 Q200 50 200 66 Q200 78 184 78 L42 78 Q40 78 40 70Z" 
                    fill={isNight ? "rgba(45, 55, 72, 0.65)" : "rgba(255,255,255,0.85)"}
                  />
                </svg>
              </div>
              <div className="absolute opacity-65 top-[30%] left-0 w-[170px] animate-drift-2" style={{ animationDelay: "-55s" }}>
                <svg viewBox="0 0 170 70" width="170" height="70">
                  <path 
                    d="M28 52 Q12 52 12 36 Q12 20 30 22 Q34 6 54 9 Q74 -4 90 10 Q110 6 116 22 Q136 22 138 38 Q150 38 150 50 Q150 58 138 58 L30 58 Q28 58 28 52Z" 
                    fill={isNight ? "rgba(45, 55, 72, 0.55)" : "rgba(255,255,255,0.7)"}
                  />
                </svg>
              </div>
              <div className="absolute opacity-55 top-[10%] left-0 w-[130px] animate-drift-3" style={{ animationDelay: "-10s" }}>
                <svg viewBox="0 0 130 55" width="130" height="55">
                  <path 
                    d="M22 40 Q10 40 10 28 Q10 16 24 17 Q27 5 42 7 Q57 -3 70 8 Q85 5 90 17 Q104 17 106 30 Q116 30 116 39 Q116 45 106 45 L23 45 Q22 45 22 40Z" 
                    fill={isNight ? "rgba(45, 55, 72, 0.45)" : "rgba(255,255,255,0.6)"}
                  />
                </svg>
              </div>
              <div className="absolute opacity-45 top-[42%] left-0 w-[200px] animate-drift-4" style={{ animationDelay: "-80s" }}>
                <svg viewBox="0 0 200 80" width="200" height="80">
                  <path 
                    d="M34 60 Q16 60 16 42 Q16 24 36 26 Q40 8 62 11 Q84 -3 102 13 Q124 7 132 26 Q154 25 158 44 Q172 44 172 56 Q172 66 158 66 L36 66 Q34 66 34 60Z" 
                    fill={isNight ? "rgba(45, 55, 72, 0.35)" : "rgba(255,255,255,0.5)"}
                  />
                </svg>
              </div>
            </>
          )}

          {/* Rain drops */}
          {isRainySky && heroRainDrops.map((drop, idx) => (
            <div
              key={idx}
              className="drop"
              style={{
                left: drop.left,
                height: drop.height,
                animationDuration: drop.duration,
                animationDelay: drop.delay,
                opacity: drop.opacity
              }}
            />
          ))}

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
          <div className="mb-2 text-[0.82rem] text-gold/80 font-medium tracking-[0.01em] print:hidden">
            Enter any global city to fetch real-time weather &amp; local attractions
          </div>
          <div className="flex items-center gap-[0.65rem] mb-[2rem] max-w-[500px] w-full relative z-30 print:hidden" ref={searchContainerRef}>
            <div className="relative flex-1">
              <input
                type="text"
                className="bg-white/8 border border-white/16 rounded-full text-paper font-body text-[0.92rem] px-[1.3rem] py-[0.7rem] w-full outline-none backdrop-blur-[6px] transition-all duration-200 placeholder:text-paper-faint focus:border-gold/60 focus:bg-white/12 disabled:opacity-50"
                placeholder={isLoadingWeather ? "AI Intelligence loading..." : "Search e.g. London, Kakinada, Tokyo..."}
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
              className="flex-shrink-0 px-5 py-[0.7rem] rounded-full bg-gold hover:bg-amber-400 disabled:bg-gold/50 disabled:cursor-not-allowed text-ink font-semibold text-[0.88rem] cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 flex items-center gap-1.5"
              aria-label="Submit Search"
            >
              {isLoadingWeather && (
                <svg className="animate-spin h-3.5 w-3.5 text-ink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoadingWeather ? "Searching..." : "Search"}
            </button>
            <button
              onClick={handleGeolocation}
              disabled={isLoadingWeather}
              className="flex-shrink-0 w-[38px] h-[38px] rounded-full bg-white/8 border border-white/16 text-paper-dim cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-white/15 hover:text-paper focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:opacity-50"
              aria-label="Use my current location"
            >
              {isLoadingWeather ? (
                <svg className="animate-spin h-3.5 w-3.5 text-paper" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
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
                <span className="font-body text-[0.95rem] font-medium text-gold tracking-[0.02em]">Querying WeatherMind AI...</span>
              </div>
              <div className="font-display text-[2rem] font-light text-paper/85 leading-tight max-w-[600px]">
                Analyzing historical weather anomalies and generating packing intelligence...
              </div>
            </div>
          ) : (
            <>
              <div className="font-body text-[0.95rem] font-medium text-gold tracking-[0.02em] mb-2 print:text-gold-deep">{selectedCity.condition}</div>
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

          <div className="grid grid-cols-5 gap-[0.9rem] mb-14 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-2 print:grid print:grid-cols-5 print:gap-4" role="list" aria-label="Five day weather forecast">
            {selectedCity.forecast.map((f, i) => {
              const bgGradients = {
                sun: "bg-gradient-to-br from-[#5C87A8] to-[#2E4863]",
                cloud: "bg-gradient-to-br from-[#5A6A78] to-[#37434E]",
                rain: "bg-gradient-to-br from-[#445566] to-[#222E38]",
                "heavy-rain": "bg-gradient-to-br from-[#37424C] to-[#161E25]",
                clear: "bg-gradient-to-br from-[#4F89A8] to-[#21455C]"
              };
              const activeBg = bgGradients[f.skyType] || bgGradients.sun;
              const isRain = f.skyType === "rain" || f.skyType === "heavy-rain";

              return (
                <div
                  key={i}
                  className={`rounded-[20px] p-[1.3rem_1.1rem] relative overflow-hidden min-h-[178px] flex flex-col justify-between cursor-default transition-transform duration-200 ease-out hover:-translate-y-[3px] max-md:min-w-[138px] max-md:snap-start print:min-h-0 print:border print:border-card-line print:bg-none print:text-ink ${activeBg} ${i === 0 ? "ring-2 ring-gold shadow-[0_0_0_2px_var(--color-gold)] print:ring-0" : ""}`}
                  role="listitem"
                  tabIndex={0}
                >
                  {/* Mini animated rain drops inside cards */}
                  {isRain && isMounted && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden" aria-hidden="true">
                      {(i === 2 ? miniRainDrops1 : miniRainDrops2).map((drop, idx) => (
                        <div
                          key={idx}
                          className="mini-drop"
                          style={{
                            left: drop.left,
                            height: drop.height,
                            animationDuration: drop.duration,
                            animationDelay: drop.delay,
                            opacity: drop.opacity
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="font-body text-[0.78rem] font-semibold text-paper/92 uppercase tracking-[0.05em] print:text-slate">{f.day}</div>
                  
                  <span className="absolute top-[0.6rem] right-[0.7rem] opacity-90 print:text-ink" aria-hidden="true">
                    {f.skyType === "sun" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FBE3B0" strokeWidth="1.6"><circle cx="13" cy="9" r="4"/><path d="M13 2v2M13 16v2M6.5 9h-2M22 9h-2M8.5 4.5L7 3M19 15l-1.5-1.5M8.5 13.5L7 15M19 3l-1.5 1.5"/></svg>
                    )}
                    {f.skyType === "cloud" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E7ECEF" strokeWidth="1.6"><path d="M18 11h-1.3A8 8 0 1 0 9 21h9a5 5 0 0 0 0-10z"/></svg>
                    )}
                    {f.skyType === "rain" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#CFE0EC" strokeWidth="1.6"><path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M9 19v3M13 21v2M17 19v3"/></svg>
                    )}
                    {f.skyType === "heavy-rain" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#BFD2E0" strokeWidth="1.6"><path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 19v3M12 21v3M16 19v3"/></svg>
                    )}
                    {f.skyType === "clear" && (
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FBE3B0" strokeWidth="1.6"><circle cx="13" cy="9" r="4"/><path d="M13 2v2M13 16v2M6.5 9h-2M22 9h-2M8.5 4.5L7 3M19 15l-1.5-1.5M8.5 13.5L7 15M19 3l-1.5 1.5"/></svg>
                    )}
                  </span>

                  <div>
                    <div className="flex items-baseline gap-[0.4rem] mt-[0.6rem] print:text-ink">
                      <span className="font-display text-[1.7rem] font-medium text-paper print:text-ink">{f.tempHigh}°</span>
                      <span className="font-body text-[0.85rem] text-paper/60 print:text-slate">{f.tempLow}°</span>
                    </div>
                    <div className="font-body text-[0.78rem] text-paper/75 mt-[0.2rem] print:text-slate">{f.condition}</div>
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

            {/* Worth your time nearby */}
            <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] flex flex-col justify-between max-md:col-span-1">
              <div>
                <div className="font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">Worth your time nearby</div>
                <div className="grid grid-cols-3 gap-[0.5rem] mt-[0.9rem]" role="list" aria-label={`Places to visit in ${selectedCity.city}`}>
                  {selectedCity.places.slice(0, 3).map((place, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPlace(place)}
                      className="aspect-[4/3] rounded-[12px] relative overflow-hidden cursor-pointer border-none p-0 group focus-visible:outline-2 focus-visible:outline-gold-deep focus-visible:outline-offset-2"
                      role="listitem"
                      aria-label={place.name}
                    >
                      <Image
                        src={place.image}
                        alt={place.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 120px"
                        className="w-full h-full object-cover block transition-transform duration-450 ease-out group-hover:scale-106"
                      />
                      <span className="absolute bottom-0 left-0 right-0 p-[0.4rem_0.5rem_0.3rem] bg-gradient-to-t from-black/75 to-transparent font-body text-[0.68rem] font-semibold text-white text-left leading-tight">
                        {place.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Google Map Card */}
            <div className="bg-card border border-card-line rounded-[18px] p-[1.4rem_1.5rem] flex flex-col justify-between max-md:col-span-1">
              <div>
                <div className="font-body text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-slate mb-[0.7rem]">Interactive Map</div>
                <div className="rounded-[12px] overflow-hidden border border-card-line bg-[#E5E3DF] relative h-[105px] w-full">
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
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kakinada, Tokyo"
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
                  {recentHistQueries.map((q: any) => (
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
          <p className="font-body text-[0.82rem] text-slate leading-relaxed max-w-[520px]">
            Designed &amp; Developed by <strong className="font-semibold text-ink">Guna Teja</strong>. Built as part of the PM Accelerator AI Engineer Intern technical assessment. WeatherMind is a travel weather companion that pairs real conditions with trip-aware packing and timing notes for places you&apos;re actually going.
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
              <div>
                <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Destination City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paris, Tokyo, Istanbul"
                  value={modalCity}
                  onChange={(e) => setModalCity(e.target.value)}
                  className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[0.75rem] font-semibold uppercase tracking-wider text-slate mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="w-full bg-white border border-card-line rounded-lg px-3 py-2 text-ink text-[0.9rem] outline-none focus:border-gold-deep focus:ring-1 focus:ring-gold-deep transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-card-line">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-card-line text-slate hover:bg-black/5 text-[0.85rem] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-ink text-paper hover:bg-[#2B333D] text-[0.85rem] font-semibold transition-colors"
                >
                  Save Trip
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
