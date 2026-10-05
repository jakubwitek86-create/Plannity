import { useQuery } from "@tanstack/react-query";
import { getWeather, type WeatherResponse } from "@/lib/weather";
import { formatDatePl } from "@/lib/utils";
import { Cloud, CloudRain, Sun, Bike } from "lucide-react";

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weather"],
    queryFn: getWeather,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">Dziś</p>
        <h1 className="text-3xl md:text-4xl font-bold capitalize">{formatDatePl()}</h1>
      </div>

      {isLoading && <div className="text-muted-foreground">Ładowanie pogody...</div>}
      {!!error && <div className="text-destructive text-sm">Nie udało się pobrać pogody.</div>}
      {data && <WeatherSection data={data} />}
    </div>
  );
}

function WeatherSection({ data }: { data: WeatherResponse }) {
  const now = new Date();
  const nextHours = (hours: WeatherResponse[keyof WeatherResponse]["hours"], count = 3) => {
    const nowMs = now.getTime();
    return hours.filter((h) => new Date(h.time).getTime() >= nowMs - 30 * 60 * 1000).slice(0, count);
  };

  const bikeWindow = (label: string, startHour: number, endHour: number) => {
    const today = now.toISOString().slice(0, 10);
    const inWindow = data.ochota.hours.filter((h) => {
      const d = new Date(h.time);
      if (d.toISOString().slice(0, 10) !== today) return false;
      const hh = d.getHours();
      return hh >= startHour && hh <= endHour;
    });
    if (inWindow.length === 0) {
      return { label, ok: null as boolean | null, detail: "Okno już minęło" };
    }
    const maxProb = Math.max(...inWindow.map((h) => h.prob));
    const maxPrec = Math.max(...inWindow.map((h) => h.precip));
    const ok = maxProb < 30 && maxPrec < 0.2;
    return { label, ok, detail: `Max opady ${maxProb}%, ${maxPrec.toFixed(1)}mm` };
  };

  const windows = [
    bikeWindow("Rano (7:00–8:30) — dojazd", 7, 8),
    bikeWindow("Popołudnie (16:00–17:30) — powrót", 16, 17),
  ];

  return (
    <>
      <section>
        <h2 className="text-lg font-semibold mb-3">Pogoda — najbliższe 3 godziny</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <LocationCard forecast={data.ochota} hours={nextHours(data.ochota.hours)} />
          <LocationCard forecast={data.zoliborz} hours={nextHours(data.zoliborz.hours)} />
        </div>
        <div className="mt-3 bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Cloud size={16} /> Warszawa (centrum)
          </div>
          <div className="flex gap-4 flex-wrap">
            {nextHours(data.centrum.hours).map((h) => (
              <HourChip key={h.time} h={h} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Bike size={20} /> Rekomendacja rowerowa (Ochota)
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {windows.map((w) => (
            <div
              key={w.label}
              className={`rounded-xl p-4 border-2 ${
                w.ok === true
                  ? "bg-success/10 border-success/40"
                  : w.ok === false
                    ? "bg-destructive/10 border-destructive/40"
                    : "bg-muted border-border"
              }`}
            >
              <div className="text-sm font-medium">{w.label}</div>
              <div
                className={`text-lg font-bold mt-1 ${
                  w.ok === true ? "text-success" : w.ok === false ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {w.ok === true ? "✓ Można jechać rowerem" : w.ok === false ? "✗ Lepiej nie jechać — możliwe opady" : "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{w.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function LocationCard({ forecast, hours }: { forecast: WeatherResponse[keyof WeatherResponse]; hours: WeatherResponse[keyof WeatherResponse]["hours"] }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{forecast.nazwa}</div>
        <WeatherIcon prob={hours[0]?.prob ?? 0} />
      </div>
      <div className="flex gap-3 flex-wrap">
        {hours.map((h) => (
          <HourChip key={h.time} h={h} />
        ))}
      </div>
    </div>
  );
}

function HourChip({ h }: { h: { time: string; temp: number; prob: number } }) {
  const hh = new Date(h.time).getHours().toString().padStart(2, "0");
  return (
    <div className="text-center bg-muted rounded-lg px-3 py-2 min-w-[70px]">
      <div className="text-xs text-muted-foreground">{hh}:00</div>
      <div className="font-bold">{Math.round(h.temp)}°</div>
      <div className="text-[11px] text-muted-foreground">💧 {h.prob}%</div>
    </div>
  );
}

function WeatherIcon({ prob }: { prob: number }) {
  if (prob > 50) return <CloudRain className="text-primary" />;
  if (prob > 20) return <Cloud className="text-muted-foreground" />;
  return <Sun className="text-warning" />;
}
