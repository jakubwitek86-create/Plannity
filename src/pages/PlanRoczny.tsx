import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { currency } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type Cel = {
  id: string;
  kategoria: string;
  opis: string;
  kwota: number | null;
  data_docelowa: string | null;
  status: string;
  notatki: string | null;
  kolejnosc: number;
};

type Marzenie = { id: string; tekst: string; zrealizowane: boolean; kolejnosc: number };

const STATUS_OPTS = [
  { v: "do_zrobienia", l: "Do zrobienia" },
  { v: "w_trakcie", l: "W trakcie" },
  { v: "zrealizowane", l: "Zrealizowane" },
];

export default function PlanRoczny() {
  const qc = useQueryClient();
  const { data: cele } = useQuery({
    queryKey: ["cele"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_roczny_cele").select("*").order("kategoria").order("kolejnosc");
      if (error) throw error;
      return data as Cel[];
    },
  });
  const { data: marzenia } = useQuery({
    queryKey: ["marzenia"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plan_roczny_marzenia").select("*").order("kolejnosc");
      if (error) throw error;
      return data as Marzenie[];
    },
  });

  const updateCel = useMutation({
    mutationFn: async (patch: Partial<Cel> & { id: string }) => {
      const { error } = await supabase.from("plan_roczny_cele").update(patch).eq("id", patch.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cele"] }),
  });
  const deleteCel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_roczny_cele").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cele"] }),
  });
  const addCel = useMutation({
    mutationFn: async (kategoria: string) => {
      const { error } = await supabase.from("plan_roczny_cele").insert({ kategoria, opis: "Nowy cel", status: "do_zrobienia" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cele"] }),
  });

  const toggleMarzenie = useMutation({
    mutationFn: async (m: Marzenie) => {
      const { error } = await supabase.from("plan_roczny_marzenia").update({ zrealizowane: !m.zrealizowane }).eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marzenia"] }),
  });
  const deleteMarzenie = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_roczny_marzenia").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marzenia"] }),
  });
  const [nowe, setNowe] = useState("");
  const addMarzenie = useMutation({
    mutationFn: async () => {
      if (!nowe.trim()) return;
      const { error } = await supabase.from("plan_roczny_marzenia").insert({ tekst: nowe.trim() });
      if (error) throw error;
      setNowe("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["marzenia"] }),
  });

  const grouped: Record<string, Cel[]> = {};
  (cele ?? []).forEach((c) => {
    (grouped[c.kategoria] ||= []).push(c);
  });

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">4mat Plan Roczny</h1>
        <p className="text-muted-foreground text-sm mt-1">Cele pogrupowane po kategoriach. Każdy edytowalny i zapisywany w chmurze.</p>
      </div>

      {Object.entries(grouped).map(([kat, items]) => (
        <section key={kat}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">{kat}</h2>
            <button
              onClick={() => addCel.mutate(kat)}
              className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus size={14} /> Dodaj cel
            </button>
          </div>
          <div className="space-y-2">
            {items.map((c) => (
              <CelRow key={c.id} cel={c} onUpdate={(p) => updateCel.mutate({ id: c.id, ...p })} onDelete={() => deleteCel.mutate(c.id)} />
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2 className="text-xl font-semibold mb-3">Lista marzeń / do zrobienia</h2>
        <div className="bg-card border rounded-xl p-4 space-y-2">
          {(marzenia ?? []).map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-1.5">
              <input type="checkbox" checked={m.zrealizowane} onChange={() => toggleMarzenie.mutate(m)} className="w-5 h-5 accent-primary" />
              <span className={`flex-1 ${m.zrealizowane ? "line-through text-muted-foreground" : ""}`}>{m.tekst}</span>
              <button onClick={() => deleteMarzenie.mutate(m.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t">
            <input
              value={nowe}
              onChange={(e) => setNowe(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMarzenie.mutate()}
              placeholder="Nowe marzenie..."
              className="flex-1 px-3 py-2 rounded-lg border bg-background outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={() => addMarzenie.mutate()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">
              Dodaj
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CelRow({ cel, onUpdate, onDelete }: { cel: Cel; onUpdate: (p: Partial<Cel>) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [opis, setOpis] = useState(cel.opis);
  return (
    <div className="bg-card border rounded-lg">
      <div className="flex items-center gap-3 p-3">
        <select
          value={cel.status}
          onChange={(e) => onUpdate({ status: e.target.value })}
          className={`text-xs rounded-full px-2 py-1 border ${
            cel.status === "zrealizowane"
              ? "bg-success/15 text-success border-success/40"
              : cel.status === "w_trakcie"
                ? "bg-warning/15 text-warning-foreground border-warning/40"
                : "bg-muted"
          }`}
        >
          {STATUS_OPTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
        <input
          value={opis}
          onChange={(e) => setOpis(e.target.value)}
          onBlur={() => opis !== cel.opis && onUpdate({ opis })}
          className={`flex-1 bg-transparent outline-none text-sm ${cel.status === "zrealizowane" ? "line-through text-muted-foreground" : ""}`}
        />
        {cel.kwota != null && <span className="text-xs text-muted-foreground whitespace-nowrap">{currency(Number(cel.kwota))}</span>}
        {cel.data_docelowa && <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{cel.data_docelowa}</span>}
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground">
          •••
        </button>
      </div>
      {expanded && (
        <div className="border-t p-3 space-y-2 bg-muted/30">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Kwota
              <input
                type="number"
                defaultValue={cel.kwota ?? ""}
                onBlur={(e) => onUpdate({ kwota: e.target.value ? Number(e.target.value) : null })}
                className="w-full mt-1 px-2 py-1 rounded border bg-background text-sm"
              />
            </label>
            <label className="text-xs">
              Data docelowa
              <input
                type="date"
                defaultValue={cel.data_docelowa ?? ""}
                onBlur={(e) => onUpdate({ data_docelowa: e.target.value || null })}
                className="w-full mt-1 px-2 py-1 rounded border bg-background text-sm"
              />
            </label>
          </div>
          <textarea
            placeholder="Notatki"
            defaultValue={cel.notatki ?? ""}
            onBlur={(e) => onUpdate({ notatki: e.target.value || null })}
            className="w-full px-2 py-1 rounded border bg-background text-sm"
            rows={2}
          />
          <button
            onClick={() => {
              onDelete();
              toast.success("Usunięto");
            }}
            className="text-xs text-destructive flex items-center gap-1"
          >
            <Trash2 size={12} /> Usuń cel
          </button>
        </div>
      )}
    </div>
  );
}
