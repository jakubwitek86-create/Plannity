import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";

type Pom = { id: string; nazwa: string; kolejnosc: number };
type Ob = { id: string; pomieszczenie_id: string; nazwa: string; przypisane_do: string; kolejnosc: number };
type Pod = { id: string; obowiazek_id: string; tekst: string; zrobione: boolean; kolejnosc: number };

const PRZ = ["Jakub", "Ola", "Wspólnie"];

export default function ObowiazkiPage() {
  const qc = useQueryClient();
  const { data: poms } = useQuery({
    queryKey: ["poms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("obowiazki_pomieszczenia").select("*").order("kolejnosc");
      if (error) throw error;
      return data as Pom[];
    },
  });
  const { data: obs } = useQuery({
    queryKey: ["obs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("obowiazki").select("*").order("kolejnosc");
      if (error) throw error;
      return data as Ob[];
    },
  });
  const { data: pods } = useQuery({
    queryKey: ["pods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("obowiazki_podpunkty").select("*").order("kolejnosc");
      if (error) throw error;
      return data as Pod[];
    },
  });

  const inv = (k: string) => qc.invalidateQueries({ queryKey: [k] });
  const addPom = useMutation({
    mutationFn: async (nazwa: string) => {
      const { error } = await supabase.from("obowiazki_pomieszczenia").insert({ nazwa, kolejnosc: (poms?.length ?? 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => inv("poms"),
  });
  const addOb = useMutation({
    mutationFn: async ({ pom, nazwa }: { pom: string; nazwa: string }) => {
      const { error } = await supabase.from("obowiazki").insert({ pomieszczenie_id: pom, nazwa });
      if (error) throw error;
    },
    onSuccess: () => inv("obs"),
  });
  const updateOb = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Ob> }) => {
      const { error } = await supabase.from("obowiazki").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("obs"),
  });
  const delOb = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obowiazki").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      inv("obs");
      inv("pods");
    },
  });
  const addPod = useMutation({
    mutationFn: async ({ ob, tekst }: { ob: string; tekst: string }) => {
      const { error } = await supabase.from("obowiazki_podpunkty").insert({ obowiazek_id: ob, tekst });
      if (error) throw error;
    },
    onSuccess: () => inv("pods"),
  });
  const togglePod = useMutation({
    mutationFn: async (p: Pod) => {
      const { error } = await supabase.from("obowiazki_podpunkty").update({ zrobione: !p.zrobione }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => inv("pods"),
  });
  const delPod = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("obowiazki_podpunkty").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => inv("pods"),
  });

  const [newPom, setNewPom] = useState("");

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Obowiązki Domowe</h1>
        <p className="text-muted-foreground text-sm mt-1">Nowy podział 2026 wg pomieszczeń. Każdy obowiązek rozwijalny z pod-checklistą.</p>
      </div>

      {(poms ?? []).map((pom) => (
        <PomSection
          key={pom.id}
          pom={pom}
          obs={(obs ?? []).filter((o) => o.pomieszczenie_id === pom.id)}
          pods={pods ?? []}
          onAddOb={(nazwa) => addOb.mutate({ pom: pom.id, nazwa })}
          onUpdateOb={(id, patch) => updateOb.mutate({ id, patch })}
          onDelOb={(id) => delOb.mutate(id)}
          onAddPod={(ob, tekst) => addPod.mutate({ ob, tekst })}
          onTogglePod={(p) => togglePod.mutate(p)}
          onDelPod={(id) => delPod.mutate(id)}
        />
      ))}

      <div className="bg-card border rounded-xl p-4 flex gap-2">
        <input
          value={newPom}
          onChange={(e) => setNewPom(e.target.value)}
          placeholder="Nowe pomieszczenie..."
          className="flex-1 px-3 py-2 rounded-lg border bg-background"
        />
        <button
          onClick={() => {
            if (newPom.trim()) {
              addPom.mutate(newPom.trim());
              setNewPom("");
            }
          }}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
        >
          Dodaj
        </button>
      </div>
    </div>
  );
}

function PomSection({
  pom,
  obs,
  pods,
  onAddOb,
  onUpdateOb,
  onDelOb,
  onAddPod,
  onTogglePod,
  onDelPod,
}: {
  pom: Pom;
  obs: Ob[];
  pods: Pod[];
  onAddOb: (nazwa: string) => void;
  onUpdateOb: (id: string, patch: Partial<Ob>) => void;
  onDelOb: (id: string) => void;
  onAddPod: (ob: string, tekst: string) => void;
  onTogglePod: (p: Pod) => void;
  onDelPod: (id: string) => void;
}) {
  const [nowy, setNowy] = useState("");
  return (
    <section className="bg-card border rounded-xl overflow-hidden">
      <div className="p-4 bg-accent/40 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">{pom.nazwa}</h2>
        <span className="text-xs text-muted-foreground">{obs.length} obowiązków</span>
      </div>
      <div className="divide-y">
        {obs.map((o) => (
          <ObRow
            key={o.id}
            ob={o}
            pods={pods.filter((p) => p.obowiazek_id === o.id)}
            onUpdate={(patch) => onUpdateOb(o.id, patch)}
            onDelete={() => onDelOb(o.id)}
            onAddPod={(t) => onAddPod(o.id, t)}
            onTogglePod={onTogglePod}
            onDelPod={onDelPod}
          />
        ))}
      </div>
      <div className="p-3 border-t flex gap-2 bg-muted/30">
        <input
          value={nowy}
          onChange={(e) => setNowy(e.target.value)}
          placeholder="Nowy obowiązek..."
          className="flex-1 px-3 py-1.5 rounded border bg-background text-sm"
        />
        <button
          onClick={() => {
            if (nowy.trim()) {
              onAddOb(nowy.trim());
              setNowy("");
            }
          }}
          className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs flex items-center gap-1"
        >
          <Plus size={12} /> Dodaj
        </button>
      </div>
    </section>
  );
}

function ObRow({
  ob,
  pods,
  onUpdate,
  onDelete,
  onAddPod,
  onTogglePod,
  onDelPod,
}: {
  ob: Ob;
  pods: Pod[];
  onUpdate: (patch: Partial<Ob>) => void;
  onDelete: () => void;
  onAddPod: (t: string) => void;
  onTogglePod: (p: Pod) => void;
  onDelPod: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newPod, setNewPod] = useState("");
  const done = pods.filter((p) => p.zrobione).length;
  return (
    <div>
      <div className="p-3 flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="text-muted-foreground">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <span className="flex-1 text-sm">{ob.nazwa}</span>
        {pods.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{pods.length}
          </span>
        )}
        <select value={ob.przypisane_do} onChange={(e) => onUpdate({ przypisane_do: e.target.value })} className="text-xs px-2 py-1 rounded border bg-background">
          {PRZ.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="pl-9 pr-4 pb-3 space-y-1.5 bg-muted/20">
          {pods.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <input type="checkbox" checked={p.zrobione} onChange={() => onTogglePod(p)} className="w-4 h-4 accent-primary" />
              <span className={`flex-1 text-sm ${p.zrobione ? "line-through text-muted-foreground" : ""}`}>{p.tekst}</span>
              <button onClick={() => onDelPod(p.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={newPod}
              onChange={(e) => setNewPod(e.target.value)}
              placeholder="Nowy podpunkt..."
              className="flex-1 px-2 py-1 rounded border bg-background text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPod.trim()) {
                  onAddPod(newPod.trim());
                  setNewPod("");
                }
              }}
            />
            <button
              onClick={() => {
                if (newPod.trim()) {
                  onAddPod(newPod.trim());
                  setNewPod("");
                }
              }}
              className="text-xs px-2 py-1 rounded bg-secondary"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
