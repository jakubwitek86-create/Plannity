import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, type ReactNode } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { currency } from "@/lib/utils";
import { AlertTriangle, TrendingUp, PiggyBank } from "lucide-react";

type KalkUst = {
  id: number;
  pensja_jakub: number;
  pensja_ola: number;
  procent_wspolne: number;
  rata_kredytu: number;
  wydatki_stale: number;
  cel_wakacje: number;
};

const BUDGET = [
  { name: "Wyjazdy i wycieczki", value: 5027, color: "#dc5a30" },
  { name: "Stałe opłaty (w tym IKZE 1000)", value: 1637, color: "#3756b0" },
  { name: "Henio", value: 519, color: "#6ebf5a" },
  { name: "Jedzenie domowe", value: 446.1, color: "#2fa37a" },
  { name: "Lekarz / Leki", value: 390, color: "#e0b24a" },
  { name: "Wyposażenie domowe", value: 364.48, color: "#2a9d8f" },
  { name: "Drogeria", value: 176.98, color: "#a84fb0" },
  { name: "Jedzenie poza domem", value: 175, color: "#b05a2f" },
  { name: "Gotówka / Bankomat", value: 50, color: "#808a94" },
];

export default function FinansePage() {
  const qc = useQueryClient();
  const { data: kalk } = useQuery({
    queryKey: ["kalk"],
    queryFn: async () => {
      const { data, error } = await supabase.from("finanse_kalkulator").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as KalkUst | null;
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Finanse</h1>
        <p className="text-muted-foreground text-sm mt-1">Stopy procentowe, monitoring kredytu, budżet, kalkulator 80% i rekomendacje.</p>
      </div>

      <Section title="Stopy procentowe — Polska">
        <StatGrid
          items={[
            ["Stopa referencyjna NBP", "3,75%", "posiedzenie 7–8.07.2026, bez zmian"],
            ["WIBOR 3M", "3,81%", "stan 22.07.2026 — podstawa kredytu"],
            ["WIRON 3M (składana)", "~3,05%", "następca WIBOR"],
            ["Stopa depozytowa NBP", "3,25%", ""],
          ]}
        />
      </Section>

      <Section title="Stopy procentowe — świat">
        <StatGrid
          items={[
            ["Fed Funds Rate (USA)", "3,50–3,75%", "efektywna ~3,63%, FOMC 28–29.07.2026"],
            ["EBC stopa depozytowa", "2,25%", "strefa euro, bez zmian"],
            ["WIG20", "3 831 pkt", "23.07, najlepszy miesiąc w roku +8%"],
            ["S&P 500", "~7 498 pkt", ""],
          ]}
        />
      </Section>

      <Section title="Monitoring kredytu hipotecznego">
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="grid md:grid-cols-4 gap-3">
            <MiniStat l="Bank" v="Erste Bank Polska S.A." />
            <MiniStat l="Kwota" v="611 000 zł" />
            <MiniStat l="Okres" v="360 mies. (30 lat)" />
            <MiniStat l="Rata deklarowana" v="~4 500 zł/mies." />
          </div>
          <p className="text-sm text-muted-foreground">
            Oprocentowanie zmienne: WIBOR 3M + marża ok. <b>1,75 p.p.</b> (do zweryfikowania w umowie). Umowa podpisana 20.07.2026,
            oddział Al. Krakowska. Pośrednik: Joanna Antczak, ANG Odpowiedzialne Finanse.
          </p>

          <div>
            <div className="text-sm font-medium mb-2">Porównanie marż</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ nazwa: "Erste (wybrany)", marza: 1.75 }, { nazwa: "ING (lipiec 2026)", marza: 1.51 }]}>
                <XAxis dataKey="nazwa" fontSize={12} />
                <YAxis fontSize={12} unit=" p.p." />
                <Tooltip />
                <Bar dataKey="marza" fill="oklch(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Uwaga: Pekao SA wymagał dodatkowego ubezpieczenia na życie z cesją (379 tys. Ola, 232 tys. Jakub) — podnosiło realny koszt
            mimo konkurencyjnej ceny nominalnej.
          </div>

          <div className="bg-warning/15 border-2 border-warning/40 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold">Refinansowanie — obserwuj, ale jeszcze nie działaj</div>
              <p className="mt-1 text-muted-foreground">
                Różnica marży Erste vs ING to ok. 0,24 p.p. Rynkowy próg opłacalności to zwykle 0,5–1,0 p.p. Koszty przeniesienia:
                prowizja 0–2% kwoty, notariusz 300–600 zł, wpis/wykreślenie hipoteki 200–300 zł. Przy 611 000 zł różnica 0,24 p.p. to
                ok. 120–130 zł/mies. — zwykle za mało by pokryć koszty. Monitoruj co miesiąc: (1) czy marże w innych bankach spadają,
                (2) czy Erste obniży marżę na wniosek (aneks lojalnościowy), (3) zmiany WIBOR/WIRON.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <BudzetSekcja />

      <KalkulatorSekcja
        kalk={kalk ?? null}
        onSave={async (patch) => {
          const { error } = await supabase.from("finanse_kalkulator").update(patch).eq("id", 1);
          if (error) throw error;
          qc.invalidateQueries({ queryKey: ["kalk"] });
        }}
      />

      <Section title="Gdzie trzymać oszczędności — opcje na dziś">
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">Instrument</th>
                <th className="text-left p-3">Oprocentowanie</th>
                <th className="text-left p-3 hidden md:table-cell">Uwagi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["Konto oszczędnościowe / lokata (promo)", "5–8%", "Fundusz awaryjny, płynność"],
                ["Lokaty — średnia rynkowa", "~3,7%", ""],
                ["Obligacje ROR (roczne, zmienne)", "4,00%", "Powiązane ze stopą NBP"],
                ["Obligacje COI (4-letnie, inflacyjne)", "4,75%", "W 1. roku"],
                ["Obligacje EDO (10-letnie, inflacyjne)", "5,35%", "W 1. roku"],
                ["IKE — limit 2026", "—", "28 260 zł/rok, zyski bez Belki"],
                ["IKZE — limit 2026", "—", "11 304 zł/rok, odliczenie od PIT"],
                ["ETF globalne", "~7–10%/rok hist.", "Długi horyzont, zmienność"],
              ].map(([a, b, c]) => (
                <tr key={a}>
                  <td className="p-3 font-medium">{a}</td>
                  <td className="p-3">{b}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Jak bym to poukładał" icon={<TrendingUp size={20} />}>
        <div className="bg-card border rounded-xl p-5 space-y-3 text-sm leading-relaxed">
          <p><b>1) Poduszka bezpieczeństwa najpierw</b> — 3–6 miesięcy wydatków stałych (~25–55 tys. zł), płynna forma.</p>
          <p>
            <b>2) Nadpłata kredytu vs inwestowanie</b> — kredyt kosztuje ok. 5,5–5,6%/rok (WIBOR + marża), to więcej niż lokaty/ROR.
            Rozsądny podział między nadpłatę a instrumenty o wyższym oczekiwanym zwrocie po zbudowaniu poduszki.
          </p>
          <p>
            <b>3) IKE/IKZE przed zwykłym maklerskim</b> — wypełnić limity obu (IKZE 11 304 zł/rok, IKE 28 260 zł/rok każde z osobna),
            dopiero nadwyżkę w ETF globalny 10+ lat z regularnym dokupowaniem.
          </p>
          <p><b>4) Wakacje jako osobny fundusz</b> — stała kwota miesięcznie (np. 1000 zł), nie z bieżącej nadwyżki "jak wyjdzie".</p>
          <p>
            <b>5) Kredyt</b> — nie refinansować teraz (0,24 p.p. nie pokrywa kosztów przeniesienia), ale po 6–12 miesiącach spłacania
            bez opóźnień zadzwonić do Erste i zapytać o obniżkę marży lojalnościową.
          </p>
        </div>
      </Section>

      <div className="text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg leading-relaxed">
        <b>Zastrzeżenie:</b> to zestawienie ma charakter informacyjny/edukacyjny, nie stanowi porady inwestycyjnej ani kredytowej. Dane
        rynkowe z 25.07.2026 mogą się zmienić — przed decyzją sprawdź aktualne warunki w banku/u doradcy oraz w oficjalnej umowie
        kredytowej z Erste Bank.
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
function StatGrid({ items }: { items: [string, string, string][] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(([l, v, s]) => (
        <div key={l} className="bg-card border rounded-xl p-4">
          <div className="text-xs text-muted-foreground">{l}</div>
          <div className="text-2xl font-bold mt-1 text-primary">{v}</div>
          {s && <div className="text-[11px] text-muted-foreground mt-1">{s}</div>}
        </div>
      ))}
    </div>
  );
}
function MiniStat({ l, v }: { l: string; v: string }) {
  return (
    <div className="bg-muted/40 rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{l}</div>
      <div className="font-semibold text-sm mt-0.5">{v}</div>
    </div>
  );
}

function BudzetSekcja() {
  const przychody = 10160;
  const wydatki = BUDGET.reduce((a, b) => a + b.value, 0);
  const dostepne = przychody - wydatki;
  const jedzenie = 446.1 + 175;

  return (
    <Section title="Budżet domowy — ostatni pełny cykl (styczeń 2026)">
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs mb-3 text-muted-foreground">
        <b>Zastrzeżenie:</b> dane z <b>jednego miesiąca</b> (styczeń 2026), sprzed podpisania kredytu (20.07.2026). Od sierpnia dojdzie
        rata ~4 500 zł. Koszty związane z zakupem mieszkania prawdopodobnie spadną. Kolejne miesiące w arkuszu były niepełne.
      </div>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <MiniStat l="Przychody" v={currency(przychody)} />
        <MiniStat l="Łączne wydatki" v={currency(wydatki)} />
        <MiniStat l="Dostępne środki" v={currency(dostepne)} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={BUDGET} dataKey="value" nameKey="name" outerRadius={100} label={(e) => `${Math.round((e.value / wydatki) * 100)}%`}>
                {BUDGET.map((b) => (
                  <Cell key={b.name} fill={b.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => currency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border rounded-xl p-4 text-sm">
          <table className="w-full">
            <tbody className="divide-y">
              {BUDGET.map((b) => (
                <tr key={b.name}>
                  <td className="py-1.5">
                    <span className="inline-block w-3 h-3 rounded mr-2 align-middle" style={{ background: b.color }} />
                    {b.name}
                  </td>
                  <td className="py-1.5 text-right font-medium">{currency(b.value)}</td>
                  <td className="py-1.5 text-right text-muted-foreground text-xs w-12">{Math.round((b.value / wydatki) * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Łączne wydatki na jedzenie (domowe + poza domem): <b>{currency(jedzenie)}/mies.</b> w tym cyklu. Wyjazdy zawyżone
            jednorazowym wyjazdem do Turcji (4 597 zł).
          </div>
        </div>
      </div>
    </Section>
  );
}

function KalkulatorSekcja({ kalk, onSave }: { kalk: KalkUst | null; onSave: (p: Partial<KalkUst>) => Promise<void> }) {
  const [f, setF] = useState<KalkUst>({
    id: 1,
    pensja_jakub: 8500,
    pensja_ola: 7000,
    procent_wspolne: 80,
    rata_kredytu: 4500,
    wydatki_stale: 4500,
    cel_wakacje: 12000,
  });
  useEffect(() => {
    if (kalk) setF(kalk);
  }, [kalk]);

  const wplyw = (Number(f.pensja_jakub) + Number(f.pensja_ola)) * (Number(f.procent_wspolne) / 100);
  const poRacie = wplyw - Number(f.rata_kredytu);
  const nadwyzka = Math.max(0, poRacie - Number(f.wydatki_stale));
  const nadplata = nadwyzka * 0.45;
  const oszczednosci = nadwyzka * 0.35;
  const wakacje = nadwyzka * 0.2;
  const miesiaceDoCelu = wakacje > 0 ? Math.ceil(Number(f.cel_wakacje) / wakacje) : Infinity;

  const set = (k: keyof KalkUst, v: number) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    await onSave({
      pensja_jakub: f.pensja_jakub,
      pensja_ola: f.pensja_ola,
      procent_wspolne: f.procent_wspolne,
      rata_kredytu: f.rata_kredytu,
      wydatki_stale: f.wydatki_stale,
      cel_wakacje: f.cel_wakacje,
    });
  };

  return (
    <Section title="Kalkulator: 80% na wspólne konto, nadpłata, oszczędności, wakacje" icon={<PiggyBank size={20} />}>
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <NumInput label="Pensja Jakub (netto)" value={f.pensja_jakub} onChange={(v) => set("pensja_jakub", v)} />
          <NumInput label="Pensja Ola (netto)" value={f.pensja_ola} onChange={(v) => set("pensja_ola", v)} />
          <NumInput label="% na wspólne konto" value={f.procent_wspolne} onChange={(v) => set("procent_wspolne", v)} suffix="%" />
          <NumInput label="Rata kredytu" value={f.rata_kredytu} onChange={(v) => set("rata_kredytu", v)} />
          <NumInput label="Pozostałe wydatki stałe" value={f.wydatki_stale} onChange={(v) => set("wydatki_stale", v)} />
          <NumInput label="Cel wakacji / rok" value={f.cel_wakacje} onChange={(v) => set("cel_wakacje", v)} />
        </div>
        <button onClick={save} className="text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground">
          Zapisz ustawienia
        </button>

        <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t">
          <ResultStat l="Wpływ na wspólne" v={currency(wplyw)} />
          <ResultStat l="Po racie kredytu" v={currency(poRacie)} />
          <ResultStat l="Nadwyżka do podziału" v={currency(nadwyzka)} highlight />
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Podział nadwyżki (45 / 35 / 20)</div>
          <div className="flex h-10 rounded-lg overflow-hidden text-xs font-medium text-white">
            <div className="flex items-center justify-center" style={{ width: "45%", background: "#2a9d8f" }}>
              Nadpłata 45%
            </div>
            <div className="flex items-center justify-center" style={{ width: "35%", background: "#3fae7a" }}>
              Oszczędności 35%
            </div>
            <div className="flex items-center justify-center" style={{ width: "20%", background: "#e0b24a", color: "#20242c" }}>
              Wakacje 20%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Nadpłata</div>
              <div className="font-bold">{currency(nadplata)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Oszczędności</div>
              <div className="font-bold">{currency(oszczednosci)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Wakacje</div>
              <div className="font-bold">{currency(wakacje)}</div>
            </div>
          </div>
        </div>

        <div className={`text-sm p-3 rounded-lg ${wakacje > 0 && miesiaceDoCelu <= 12 ? "bg-success/15 text-success" : "bg-warning/15 text-warning-foreground"}`}>
          {wakacje <= 0
            ? "⚠️ Nadwyżka = 0 zł. Trzeba zmniejszyć wydatki stałe albo zwiększyć % na wspólne."
            : miesiaceDoCelu <= 12
              ? `✓ Fundusz wakacji: zbierzesz cel (${currency(f.cel_wakacje)}) w ~${miesiaceDoCelu} miesięcy — tempo wystarcza na 1 rok.`
              : `⚠️ Fundusz wakacji: zbierzesz cel dopiero w ~${miesiaceDoCelu} miesięcy — tempo nie wystarcza na 12 miesięcy.`}
        </div>
      </div>
    </Section>
  );
}

function NumInput({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="text-xs">
      {label}
      <div className="relative">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm" />
        {suffix && <span className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
function ResultStat({ l, v, highlight }: { l: string; v: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? "bg-primary/10 border-2 border-primary/30" : "bg-muted/40"}`}>
      <div className="text-xs text-muted-foreground">{l}</div>
      <div className={`text-lg font-bold ${highlight ? "text-primary" : ""}`}>{v}</div>
    </div>
  );
}
