-- Schemat bazy Plannity (Supabase / Postgres).
-- Ta baza JUŻ ISTNIEJE i jest zasiana danymi (ten sam projekt Supabase,
-- którego wcześniej użyła wersja zbudowana w Lovable: qkrrqhrezyyklwezacst).
-- Ten plik jest tu jako dokumentacja / punkt odniesienia — NIE trzeba go
-- ponownie uruchamiać, aplikacja już się do tej bazy łączy.
--
-- Jeśli kiedyś zakładasz zupełnie NOWY, niezależny projekt Supabase,
-- wklej ten plik do SQL Editora w nowym projekcie, żeby odtworzyć
-- całą strukturę + dane startowe, a potem podmień URL i klucz
-- w src/lib/supabase.ts.

-- Utility trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Plan roczny cele
CREATE TABLE public.plan_roczny_cele (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kategoria TEXT NOT NULL,
  opis TEXT NOT NULL,
  kwota NUMERIC,
  data_docelowa DATE,
  status TEXT NOT NULL DEFAULT 'do_zrobienia',
  notatki TEXT,
  kolejnosc INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_roczny_cele TO authenticated;
GRANT ALL ON public.plan_roczny_cele TO service_role;
ALTER TABLE public.plan_roczny_cele ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all cele" ON public.plan_roczny_cele FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cele_updated BEFORE UPDATE ON public.plan_roczny_cele FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Marzenia
CREATE TABLE public.plan_roczny_marzenia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tekst TEXT NOT NULL,
  zrealizowane BOOLEAN NOT NULL DEFAULT false,
  kolejnosc INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_roczny_marzenia TO authenticated;
GRANT ALL ON public.plan_roczny_marzenia TO service_role;
ALTER TABLE public.plan_roczny_marzenia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all marzenia" ON public.plan_roczny_marzenia FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Nawyki
CREATE TABLE public.nawyki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazwa TEXT NOT NULL,
  cel_procent INT NOT NULL DEFAULT 100,
  aktywny BOOLEAN NOT NULL DEFAULT true,
  kolejnosc INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nawyki TO authenticated;
GRANT ALL ON public.nawyki TO service_role;
ALTER TABLE public.nawyki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all nawyki" ON public.nawyki FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.nawyki_logi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nawyk_id UUID NOT NULL REFERENCES public.nawyki(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  wykonane BOOLEAN NOT NULL DEFAULT true,
  wykonane_przez TEXT,
  UNIQUE (nawyk_id, data)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nawyki_logi TO authenticated;
GRANT ALL ON public.nawyki_logi TO service_role;
ALTER TABLE public.nawyki_logi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all logi" ON public.nawyki_logi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Obowiązki
CREATE TABLE public.obowiazki_pomieszczenia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazwa TEXT NOT NULL,
  kolejnosc INT NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obowiazki_pomieszczenia TO authenticated;
GRANT ALL ON public.obowiazki_pomieszczenia TO service_role;
ALTER TABLE public.obowiazki_pomieszczenia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all pom" ON public.obowiazki_pomieszczenia FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.obowiazki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pomieszczenie_id UUID NOT NULL REFERENCES public.obowiazki_pomieszczenia(id) ON DELETE CASCADE,
  nazwa TEXT NOT NULL,
  przypisane_do TEXT NOT NULL DEFAULT 'Wspólnie',
  kolejnosc INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obowiazki TO authenticated;
GRANT ALL ON public.obowiazki TO service_role;
ALTER TABLE public.obowiazki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all ob" ON public.obowiazki FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.obowiazki_podpunkty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obowiazek_id UUID NOT NULL REFERENCES public.obowiazki(id) ON DELETE CASCADE,
  tekst TEXT NOT NULL,
  zrobione BOOLEAN NOT NULL DEFAULT false,
  kolejnosc INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.obowiazki_podpunkty TO authenticated;
GRANT ALL ON public.obowiazki_podpunkty TO service_role;
ALTER TABLE public.obowiazki_podpunkty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all pod" ON public.obowiazki_podpunkty FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Finanse kalkulator
CREATE TABLE public.finanse_kalkulator (
  id INT PRIMARY KEY DEFAULT 1,
  pensja_jakub NUMERIC NOT NULL DEFAULT 8500,
  pensja_ola NUMERIC NOT NULL DEFAULT 7000,
  procent_wspolne INT NOT NULL DEFAULT 80,
  rata_kredytu NUMERIC NOT NULL DEFAULT 4500,
  wydatki_stale NUMERIC NOT NULL DEFAULT 4500,
  cel_wakacje NUMERIC NOT NULL DEFAULT 12000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_row CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finanse_kalkulator TO authenticated;
GRANT ALL ON public.finanse_kalkulator TO service_role;
ALTER TABLE public.finanse_kalkulator ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all fin" ON public.finanse_kalkulator FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SEEDS: Cele
INSERT INTO public.plan_roczny_cele (kategoria, opis, kwota, data_docelowa, status, kolejnosc) VALUES
('Finanse','Odkładam miesięcznie 500 PLN',500,'2025-02-01','w_trakcie',1),
('Finanse','Spłacić pożyczkę od Gosi',NULL,'2025-03-01','do_zrobienia',2),
('Finanse','Spłacić pożyczkę u Oli',3000,NULL,'do_zrobienia',3),
('Praca','Zarabiam 10 000 PLN netto',10000,'2028-11-01','w_trakcie',1),
('Praca','Mam umowę na czas nieokreślony',NULL,'2025-01-01','zrealizowane',2),
('Praca','Znaleźć pracę',NULL,'2024-08-01','zrealizowane',3),
('Rodzina','Mamy dwójkę dzieci z Olą',NULL,'2026-10-01','w_trakcie',1),
('Rodzina','Organizuję randki i wyjścia z Olą',NULL,NULL,'w_trakcie',2),
('Rozwój','Znam angielski na poziomie B2',NULL,NULL,'w_trakcie',1),
('Zdrowie','Ważę 65 kg (start ok. 77 kg)',NULL,'2025-11-01','w_trakcie',1),
('Zdrowie','Dieta',NULL,'2025-01-01','w_trakcie',2),
('Zdrowie','Nie jem słodyczy',NULL,'2024-11-18','w_trakcie',3),
('Zdrowie','Nie oglądam porno',NULL,'2024-11-18','w_trakcie',4),
('Zdrowie','Nie masturbuję się',NULL,'2024-11-18','w_trakcie',5),
('Zdrowie','Mam przeszczep włosów',NULL,NULL,'do_zrobienia',6),
('Zdrowie','Mam implant zęba (odkładane po 500/mies.)',7000,'2025-12-01','w_trakcie',7),
('Zdrowie','Mam licówkę na zębie (odkładane po 125/mies.)',1500,'2025-12-01','w_trakcie',8),
('Zdrowie','Treningi 3 razy w tygodniu',NULL,'2024-12-24','w_trakcie',9),
('Zdrowie','Nie piję alkoholu',NULL,'2024-12-21','w_trakcie',10),
('Zdrowie','Nie palę papierosów',NULL,'2024-11-02','w_trakcie',11),
('Zdrowie','Psychoterapia',NULL,'2024-10-01','w_trakcie',12);

-- Marzenia
INSERT INTO public.plan_roczny_marzenia (tekst, kolejnosc) VALUES
('Nurkowanie z butlą',1),('Lot paralotnią',2),('Iść na strzelnicę',3),
('Kurs na sternika',4),('Pokierować motorówką',5),('Popłynąć na skuterze wodnym',6),
('Polatać dronem',7);

-- Nawyki
INSERT INTO public.nawyki (nazwa, cel_procent, kolejnosc) VALUES
('Zero cukru',100,1),('Zero masturbacji',100,2),('Zero porno',100,3),
('Trening',42,4),('Zero palenia',100,5),('Zero alko',100,6),('Angielski',28,7);

-- Pomieszczenia + obowiązki
WITH p AS (
  INSERT INTO public.obowiazki_pomieszczenia (nazwa, kolejnosc) VALUES
    ('Łazienka',1),('Kuchnia',2),('Sypialnia',3),('Salon',4),('Przedpokój',5)
  RETURNING id, nazwa
)
INSERT INTO public.obowiazki (pomieszczenie_id, nazwa, kolejnosc)
SELECT p.id, o.nazwa, o.kol FROM p JOIN (VALUES
  ('Łazienka','Wstawienie prania',1),('Łazienka','Rozwieszenie prania',2),('Łazienka','Złożenie prania',3),
  ('Łazienka','Umycie podłogi',4),('Łazienka','Umycie kibelka',5),('Łazienka','Umycie zlewu + parapetu',6),
  ('Łazienka','Umycie kabiny',7),('Łazienka','Pranie dywaników',8),('Łazienka','Sprzątanie szafek',9),
  ('Łazienka','Sprzątanie odpływu umywalki',10),
  ('Kuchnia','Wyrzucanie plastikowych butelek',1),('Kuchnia','Wyrzucanie szklanych butelek',2),
  ('Kuchnia','Wstawianie zmywarki',3),('Kuchnia','Rozpakowywanie zmywarki',4),
  ('Kuchnia','Porządek na blacie',5),('Kuchnia','Pusty zlew',6),('Kuchnia','Zmiana filtra wody',7),
  ('Kuchnia','Mycie lodówki',8),('Kuchnia','Przegląd produktów w lodówce',9),
  ('Kuchnia','Umycie zlewu',10),('Kuchnia','Umycie kuchenki',11),('Kuchnia','Wynoszenie śmieci',12),
  ('Sypialnia','Zmiana pościeli',1),('Sypialnia','Mycie podłogi',2),('Sypialnia','Ścieranie kurzu',3),
  ('Sypialnia','Porządek na regałach',4),('Sypialnia','Zmiana pościeli Henia',5),
  ('Salon','Mycie podłogi',1),('Salon','Ścieranie kurzu',2),('Salon','Porządek na stole',3),
  ('Salon','Odkurzanie kanapy',4),('Salon','Pranie kocy i poduszek',5),
  ('Przedpokój','Porządek w kurtkach i butach',1),('Przedpokój','Odkurzanie podłogi',2),
  ('Przedpokój','Mycie podłogi',3)
) AS o(pom, nazwa, kol) ON o.pom = p.nazwa;

-- Kalkulator domyślny
INSERT INTO public.finanse_kalkulator (id) VALUES (1);
