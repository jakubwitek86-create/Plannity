import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMemo, useState } from "react";
import { daysBack, todayIso } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus } from "lucide-react";

type Nawyk = { id: string; nazwa: string; cel_procent: number; aktywny: boolean; kolejnosc: number };
type Log = { id: string; nawyk_id: string; data: string; wykonane: boolean; wykonane_przez: string | null };

export default function NawykiPage() {
  const qc = useQueryClient();
  const DAYS = 14;
  const dates = useMemo(() => daysBack(DAYS), []);
  const dates30 = useMemo(() => daysBack(30), []);

  const { data: nawyki } = useQuery({
    queryKey: ["nawyki"],
    queryFn: async () => {
      const { data, error } = await supabase.from("nawyki").select("*").eq("aktywny", true).order("kolejnosc");
      if (error) throw error;
      return data as Nawyk[];
    },
  });
  const { data: logi } = useQuery({
    queryKey: ["nawyki_logi", dates30[0]],
    queryFn: async () => {
      const { data, error } = await supabase.from("nawyki_logi").select("*").gte("data", dates30[0]);
      if (error) throw error;
      return data as Log[];
    },
  });

  const upsertLog = useMutation({
    mutationFn: async ({ nawyk_id, data, wykonane }: { nawyk_id: string; data: string; wykonane: boolean }) => {
      const email = (await supabase.auth.getUser()).data.user?.email ?? "";
      const przez = email.toLowerCase().includes("ola") ? "Ola" : "Jakub";
      const { error } = await supabase
        .from("nawyki_logi")
        .upsert({ nawyk_id, data, wykonane, wykonane_przez: przez }, { onConflict: "nawyk_id,data" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nawyki_logi"] }),
  });

  const [newName, setNewName] = useState("");
  const [newCel, setNewCel] = useState(100);
  const addNawyk = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) return;
      const { error } = await supabase.from("nawyki").insert({ nazwa: newName.trim(), cel_procent: newCel });
      if (error) throw error;
      setNewName("");
      setNewCel(100);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["nawyki"] }),
  });

  const logMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (logi ?? []).forEach((l) => m.set(`${l.nawyk_id}|${l.data}`, l.wykonane));
    return m;
  }, [logi]);

  const stats = (nawyk_id: string) => {
    const check = (arr: string[]) => arr.filter((d) => logMap.get(`${nawyk_id}|${d}`)).length;
    const total7 = check(daysBack(7));
    const total30 = check(dates30);
    let streak = 0;
    for (let i = dates30.length - 1; i >= 0; i--) {
      if (logMap.get(`${nawyk_id}|${dates30[i]}`)) streak++;
      else break;
    }
    return { pct7: Math.round((total7 / 7) * 100), pct30: Math.round((total30 / 30) * 100), streak };
  };

  const chartData = dates30.map((d) => {
    const total = (nawyki ?? []).length;
    const done = (nawyki ?? []).filter((n) => logMap.get(`${n.id}|${d}`)).length;
    return { data: d.slice(5), procent: total ? Math.round((done / total) * 100) : 0 };
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nawyki — Monitorowanie i Statystyki</h1>
        <p className="text-muted-foreground text-sm mt-1">Odznaczaj codziennie. Streaki, % 7/30 dni względem celu.</p>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <div className="text-sm font-medium mb-2">Ogólny trend (średni % wykonanych nawyków dziennie, 30 dni)</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="data" fontSize={11} />
            <YAxis fontSize={11} domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="procent" stroke="oklch(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto bg-card border rounded-xl">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 sticky left-0 bg-muted/50 z-10">Nawyk</th>
              {dates.map((d) => (
                <th key={d} className="p-1 text-[10px] text-muted-foreground font-normal">
                  {d.slice(8)}
                  <br />
                  {d.slice(5, 7)}
                </th>
              ))}
              <th className="p-2 text-xs">Streak</th>
              <th className="p-2 text-xs">7d</th>
              <th className="p-2 text-xs">30d</th>
              <th className="p-2 text-xs">Cel</th>
            </tr>
          </thead>
          <tbody>
            {(nawyki ?? []).map((n) => {
              const s = stats(n.id);
              return (
                <tr key={n.id} className="border-b last:border-0">
                  <td className="p-3 font-medium sticky left-0 bg-card z-10">{n.nazwa}</td>
                  {dates.map((d) => {
                    const done = logMap.get(`${n.id}|${d}`) ?? false;
                    const isToday = d === todayIso();
                    return (
                      <td key={d} className="p-1 text-center">
                        <button
                          onClick={() => upsertLog.mutate({ nawyk_id: n.id, data: d, wykonane: !done })}
                          className={`w-7 h-7 rounded-md border transition ${
                            done ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                          } ${isToday ? "ring-2 ring-ring" : ""}`}
                        >
                          {done ? "✓" : ""}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-bold">{s.streak}</td>
                  <td className={`p-2 text-center ${s.pct7 >= n.cel_procent ? "text-success" : ""}`}>{s.pct7}%</td>
                  <td className={`p-2 text-center ${s.pct30 >= n.cel_procent ? "text-success" : ""}`}>{s.pct30}%</td>
                  <td className="p-2 text-center text-muted-foreground">{n.cel_procent}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-card border rounded-xl p-4">
        <div className="text-sm font-medium mb-2 flex items-center gap-2">
          <Plus size={16} /> Dodaj własny nawyk
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nazwa nawyku"
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border bg-background"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={newCel}
            onChange={(e) => setNewCel(Number(e.target.value))}
            className="w-24 px-3 py-2 rounded-lg border bg-background"
          />
          <span className="self-center text-sm text-muted-foreground">% cel</span>
          <button onClick={() => addNawyk.mutate()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
            Dodaj
          </button>
        </div>
      </div>
    </div>
  );
}
