# 🌤️ WeatherMind — Intelligent Travel Weather Platform

A full-stack weather and travel-intelligence app built for the **PM Accelerator AI Engineer Intern Technical Assessment** (both Tech Assessment #1 — Frontend, and Tech Assessment #2 — Backend).

**Built by:** Guna Teja
**Live demo:** https://weathmind.vercel.app/
**Repo:** https://github.com/GunaTeja777/WeatherWise-AI-Full-Stack-Intelligent-Weather-Forecasting-Platform
**Demo video:** _[add your screen-recording link here before submitting]_

> **About PM Accelerator:** PM Accelerator is a premier educational program and community dedicated to empowering future product managers and AI builders with hands-on experience, career acceleration, and design thinking.

---

## What this covers

This submission completes **both** assessment tracks:

**Tech Assessment #1 (Frontend)** — location search (city/town/zip/landmark/GPS coordinates), current-location detection, a clearly displayed current-conditions view with icons, a 5-day forecast, and graceful error handling for not-found cities and failed requests.

**Tech Assessment #2 (Backend)** — full CRUD on weather/location records backed by PostgreSQL via Prisma, RESTful API design, a date-range historical weather lookup with validation, additional API integrations (YouTube travel videos, Google Maps embed), and data export in JSON, CSV, and PDF.

---

## 🚀 Key Features

- **Multi-source geocoding** — resolves city/town names, zip/postal codes, landmarks, and raw GPS coordinates via OpenWeatherMap geocoding, Nominatim, and Open-Meteo, with reverse-geocoding for "use my location."
- **AI travel intelligence** — `google/gemini-2.5-flash` (via OpenRouter, with an automatic fallback to `google/gemini-2-flash-lite:free`) generates packing notes, health advisories, and weather-anomaly callouts, plus suggests real local points of interest.
- **5-year historical anomaly detection** — compares the upcoming 5-day forecast against 5 years of Open-Meteo archive data for the same calendar week and flags unusual temperature/precipitation trends.
- **Persistent trip management** — full Create/Read/Update/Delete on saved trips, backed by PostgreSQL through Prisma, with a `localStorage` mirror so the UI stays usable if the API is briefly unreachable.
- **Historical weather vault** — full CRUD on date-range weather lookups (`/api/weather/history`), with validation on date ranges (no inverted ranges, no future end-dates, 90-day cap, 1940 floor).
- **Caching layer** — Redis-backed response caching with an automatic in-memory fallback if Redis isn't available.
- **Data export** — trips exportable as JSON, CSV, or PDF, both client-side and via dedicated backend routes.
- **Polished, responsive UI** — React 19 + Next.js 15 + Tailwind CSS v4, glassmorphism styling, animated weather scenes, and accessible markup.

---

## 🏗️ Architecture

```mermaid
graph TD
  User((Traveler)) <--> NextJS[Next.js 15 Client]
  NextJS <-->|REST API| ExpressAPI[Express + TypeScript Server]
  ExpressAPI <-->|Prisma ORM| Postgres[(PostgreSQL)]
  ExpressAPI <-->|Caching| RedisCache[(Redis / In-memory fallback)]
  ExpressAPI <-->|AI narrative| OpenRouter[OpenRouter — Gemini 2.5 Flash]
  ExpressAPI <-->|Live conditions| OpenWeather[OpenWeatherMap API]
  ExpressAPI <-->|Geocoding| Nominatim[Nominatim / Open-Meteo Geocoding]
  ExpressAPI <-->|Historical stats| OpenMeteo[Open-Meteo Archive API]
  ExpressAPI <-->|Video guides| YouTube[YouTube Data API v3]
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Next.js 15, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript, Axios |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (with in-memory fallback) |
| AI | OpenRouter (Gemini 2.5 Flash, Gemini 2.0 Flash Lite fallback) |
| External APIs | OpenWeatherMap, Open-Meteo, Nominatim, YouTube Data API v3, Google Maps embed |

---

## 📡 API Reference

| Method | Route | Description |
|---|---|---|
| GET | `/api/status` | Health check |
| GET | `/api/weather?city=` | Current conditions + 5-day forecast for a location |
| GET | `/api/weather/reverse?lat=&lon=` | Reverse-geocode coordinates into a location's weather |
| GET | `/api/weather/history?city=&startDate=&endDate=` | Create a validated date-range historical lookup (stores the query) |
| GET | `/api/weather/history/recent` | Read recent historical lookups |
| PUT | `/api/weather/history/:id` | Update a stored historical lookup |
| DELETE | `/api/weather/history/:id` | Delete a stored historical lookup |
| GET | `/api/trips` | Read all saved trips |
| POST | `/api/trips` | Create a trip |
| PUT | `/api/trips/:id` | Update a trip |
| DELETE | `/api/trips/:id` | Delete a trip |
| GET | `/api/trips/export/json` | Export all trips as JSON |
| GET | `/api/trips/export/csv` | Export all trips as CSV |
| GET | `/api/trips/export/pdf` | Export all trips as PDF |
| GET | `/api/youtube?query=` | Travel video guides for a city |

---

## ⚡ Setup & Installation

### Prerequisite — start Postgres and Redis

```bash
docker-compose up -d
```
This launches Postgres on `localhost:5432` and Redis on `localhost:6379` with the credentials already wired into the example env file below.

### 1. Backend

```bash
cd backend
cp .env.example .env
```
Fill in your own API keys in `.env` (see table below), then:
```bash
npm install
npm run prisma:migrate
npm run dev
```
Backend runs at `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # if present — otherwise create it with NEXT_PUBLIC_BACKEND_URL
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## 🔑 Environment Variables

**`backend/.env`**

| Variable | Required | Notes |
|---|---|---|
| `PORT` | No | Defaults to `5000` |
| `DATABASE_URL` | Yes | e.g. `postgresql://postgres:postgres@localhost:5432/weathermind` (matches `docker-compose.yml`) |
| `REDIS_URL` | No | Defaults to `redis://localhost:6379`; app falls back to in-memory caching if unset/unreachable |
| `OPENWEATHERMAP_API_KEY` | Yes | Powers live conditions, forecast, and geocoding. Get one free at openweathermap.org |
| `OPENROUTER_API_KEY` | No | Powers AI packing/health/anomaly narratives and place suggestions via OpenRouter. Without it, the app serves sensible static fallback text instead |
| `YOUTUBE_API_KEY` | No | Powers the travel video guides section. Without it, mock video data is shown |

**`frontend/.env.local`**

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Yes for production | Defaults to `http://localhost:5000` for local dev. **Must be set to your deployed backend's public URL in Vercel's project settings** for the live deployment to reach the API — otherwise the deployed frontend will try to call `localhost` from the visitor's browser and silently fall back to local/cached data |

---

## ☁️ Deployment

- **Frontend** is deployed on Vercel: https://weathmind.vercel.app/
- **Backend** should be deployed separately (Render or Railway both work well for a Postgres + Redis + Express stack). After deploying, set `NEXT_PUBLIC_BACKEND_URL` in the Vercel project's environment variables to that backend's public URL and redeploy.

---

## 📄 License & Credits

Developed by Guna Teja for the PM Accelerator AI Engineer Intern Technical Assessment.
