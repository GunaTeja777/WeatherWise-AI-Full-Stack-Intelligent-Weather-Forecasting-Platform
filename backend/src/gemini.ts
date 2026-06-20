import axios from 'axios';

export async function generateAIAssistance(
  city: string,
  country: string,
  currentTemp: number,
  condition: string,
  forecastSummary: string,
  historicalDataSummary: string
) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY is not defined. Falling back to mock/fallback content.");
    return {
      packingNote: `Light layers and comfortable walking shoes. Bring a compact umbrella just in case, as ${condition.toLowerCase()} conditions prevail around ${currentTemp}°C.`,
      healthNote: `Pollen counts are moderate. Best to enjoy outdoor activities in the early morning or evening. Stay hydrated.`,
      advisory: `This week is running typical for ${city}. Plan outdoor activities around the dry windows of the forecast.`,
      places: []
    };
  }

  const prompt = `
    You are the AI Travel intelligence engine for WeatherMind.
    Your task is to analyze the destination, current weather, 5-day forecast, and historical weather comparison to generate concise, highly contextual, and elegant advice for a traveler.
    
    Also suggest up to 8 real, actual local tourist attractions or points of interest to visit in this city. If the destination is a small village or has fewer than 8 notable points of interest, return only the verified, actual number of places (could be 3, 2, 1, or even 0). Do not invent or hallucinate places, and do not duplicate places.

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

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'WeatherWise-AI'
        },
        timeout: 25000 // 25s timeout
      }
    );

    let textContent = response.data?.choices?.[0]?.message?.content || '{}';
    textContent = textContent.trim();
    
    // Clean up code blocks if the LLM returned it in markdown
    if (textContent.startsWith('```json')) {
      textContent = textContent.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (textContent.startsWith('```')) {
      textContent = textContent.replace(/^```/, '').replace(/```$/, '').trim();
    }

    const data = JSON.parse(textContent);

    return {
      packingNote: data.packingNote || "Pack typical layers for the season.",
      healthNote: data.healthNote || "Check local air quality warnings.",
      advisory: data.advisory || "Weather is typical for this season.",
      places: Array.isArray(data.places) ? data.places : []
    };
  } catch (err: any) {
    console.error("Error calling OpenRouter API:", err.response?.data || err.message);
    
    // Fallback if google/gemini-2.5-flash fails or is busy
    try {
      console.log("Attempting fallback model on OpenRouter...");
      const fallbackResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2-flash-lite:free',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'WeatherWise-AI'
          },
          timeout: 25000
        }
      );

      let textContent = fallbackResponse.data?.choices?.[0]?.message?.content || '{}';
      textContent = textContent.trim();
      if (textContent.startsWith('```json')) {
        textContent = textContent.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (textContent.startsWith('```')) {
        textContent = textContent.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const data = JSON.parse(textContent);
      return {
        packingNote: data.packingNote || "Pack typical layers for the season.",
        healthNote: data.healthNote || "Check local air quality warnings.",
        advisory: data.advisory || "Weather is typical for this season.",
        places: Array.isArray(data.places) ? data.places : []
      };
    } catch (fallbackErr: any) {
      console.error("Fallback model also failed:", fallbackErr.message);
    }

    return {
      packingNote: `Pack comfortable clothing suitable for ${currentTemp}°C and ${condition.toLowerCase()} conditions.`,
      healthNote: `Stay hydrated and be aware of any sudden weather changes during your outdoor plans.`,
      advisory: `Plan for normal weather patterns in ${city}.`,
      places: []
    };
  }
}
