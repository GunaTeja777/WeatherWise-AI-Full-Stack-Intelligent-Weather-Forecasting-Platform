import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: any = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables. Gemini calls will return mock/fallback content.");
      return null;
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateAIAssistance(
  city: string,
  country: string,
  currentTemp: number,
  condition: string,
  forecastSummary: string,
  historicalDataSummary: string
) {
  const sdk = getGenAI();
  if (!sdk) {
    return {
      packingNote: `Light layers and comfortable walking shoes. Bring a compact umbrella just in case, as ${condition.toLowerCase()} conditions prevail around ${currentTemp}°C.`,
      healthNote: `Pollen counts are moderate. Best to enjoy outdoor activities in the early morning or evening. Stay hydrated.`,
      advisory: `This week is running typical for ${city}. Plan outdoor activities around the dry windows of the forecast.`,
      places: []
    };
  }

  try {
    const model = sdk.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are the AI Travel intelligence engine for WeatherMind.
      Your task is to analyze the destination, current weather, 5-day forecast, and historical weather comparison to generate concise, highly contextual, and elegant advice for a traveler.
      Also suggest exactly 3 real, actual local tourist attractions or points of interest to visit in this city.

      Destination: ${city}, ${country}
      Current Weather: ${currentTemp}°C, ${condition}
      5-day Forecast Overview: ${forecastSummary}
      Historical Weather Trends (Last 5 Years for same date range): ${historicalDataSummary}

      Return a JSON response with exactly four fields:
      {
        "packingNote": "A very concise 1-2 sentence recommendation on what clothes or items to pack based on current/forecast temperatures, rain, and humidity.",
        "healthNote": "A concise 1-2 sentence health advisory. (e.g. AQI concern, pollen count warnings, hydration guidelines based on heat/humidity, UV protection).",
        "advisory": "A concise 1-2 sentence warning pointing out any weather anomalies compared to the 5-year historical trend. Compare the forecast sum/means with historical stats and call out if it is unusually hot, cold, dry, or wet (e.g., 'This week is running 40% wetter than historical averages - pack a rain shell...'). If no anomaly exists, highlight a key weather pattern to watch.",
        "places": [
          {
            "name": "Name of a real, famous local attraction/point of interest to visit in this city (e.g., for Paris: 'Louvre Museum', for Kakinada: 'Coringa Wildlife Sanctuary')",
            "desc": "A concise 1-2 sentence description of this specific attraction.",
            "category": "Must be one of: beach, temple, nature, park, museum, market, monument, harbor, food, city, waterfall"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    const data = JSON.parse(text);
    return {
      packingNote: data.packingNote || "Pack typical layers for the season.",
      healthNote: data.healthNote || "Check local air quality warnings.",
      advisory: data.advisory || "Weather is typical for this season.",
      places: data.places || []
    };
  } catch (err: any) {
    console.error("Error calling Gemini API:", err.message);
    return {
      packingNote: `Pack comfortable clothing suitable for ${currentTemp}°C and ${condition.toLowerCase()} conditions.`,
      healthNote: `Stay hydrated and be aware of any sudden weather changes during your outdoor plans.`,
      advisory: `Plan for normal weather patterns in ${city}.`,
      places: []
    };
  }
}
