const LOCATIONS = {
  ochota: { lat: 52.2087, lon: 20.9807, nazwa: "Ochota" },
  zoliborz: { lat: 52.2691, lon: 20.9633, nazwa: "Żoliborz" },
  centrum: { lat: 52.2297, lon: 21.0122, nazwa: "Warszawa" },
} as const;

export type WeatherHour = { time: string; temp: number; prob: number; precip: number };
export type LocationForecast = { nazwa: string; hours: WeatherHour[] };
export type WeatherResponse = Record<keyof typeof LOCATIONS, LocationForecast>;

async function fetchOne(lat: number, lon: number, nazwa: string): Promise<LocationForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation,temperature_2m&timezone=Europe%2FWarsaw&forecast_days=2`;
  const res = await fetch(url);
  const data = await res.json();
  const times: string[] = data.hourly?.time ?? [];
  const temps: number[] = data.hourly?.temperature_2m ?? [];
  const probs: number[] = data.hourly?.precipitation_probability ?? [];
  const precs: number[] = data.hourly?.precipitation ?? [];
  const hours: WeatherHour[] = times.map((t, i) => ({
    time: t,
    temp: temps[i],
    prob: probs[i] ?? 0,
    precip: precs[i] ?? 0,
  }));
  return { nazwa, hours };
}

const CACHE_KEY = "plannity_weather_cache_v1";
const TTL_MS = 10 * 60 * 1000;

export async function getWeather(): Promise<WeatherResponse> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; data: WeatherResponse };
      if (Date.now() - cached.at < TTL_MS) return cached.data;
    }
  } catch {
    // ignore cache read errors
  }

  const [ochota, zoliborz, centrum] = await Promise.all([
    fetchOne(LOCATIONS.ochota.lat, LOCATIONS.ochota.lon, LOCATIONS.ochota.nazwa),
    fetchOne(LOCATIONS.zoliborz.lat, LOCATIONS.zoliborz.lon, LOCATIONS.zoliborz.nazwa),
    fetchOne(LOCATIONS.centrum.lat, LOCATIONS.centrum.lon, LOCATIONS.centrum.nazwa),
  ]);
  const result: WeatherResponse = { ochota, zoliborz, centrum };

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: result }));
  } catch {
    // ignore cache write errors (private browsing, quota, etc.)
  }

  return result;
}
