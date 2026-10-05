# Plannity

Rodzinna aplikacja Jakuba i Oli — plan roczny, nawyki, obowiązki domowe, finanse.
Zwykły Vite + React + TypeScript (SPA), bez żadnej zależności od Lovable.
Dane trzymane są w tym samym, już istniejącym i zasianym danymi projekcie Supabase,
więc nic nie trzeba przepisywać ani resetować — to realna, trwała baza danych,
niezależna od tego, gdzie hostowany jest sam frontend.

## Jak to wgrać na GitHub i uruchomić na telefonie (krok po kroku)

### 1. Załóż puste repozytorium na GitHubie
Wejdź na https://github.com/new, nadaj nazwę np. `plannity`, zostaw je **puste**
(bez README/licencji), kliknij "Create repository".

### 2. Wypakuj ten folder i wypchnij go do repo
Na swoim komputerze, w terminalu, w folderze z rozpakowanymi plikami:

```bash
git init
git add .
git commit -m "Plannity — wersja własna, bez Lovable"
git branch -M main
git remote add origin https://github.com/<twoj-login>/plannity.git
git push -u origin main
```

(Podstaw swój login GitHub i ewentualnie inną nazwę repo.)

### 3. Włącz GitHub Pages napędzane przez Actions
W repo na GitHubie: **Settings → Pages → Build and deployment → Source**
ustaw na **"GitHub Actions"** (nie "Deploy from a branch").

Workflow `.github/workflows/deploy.yml` jest już w projekcie — po pierwszym
pushu do `main` sam zbuduje i opublikuje aplikację. Podgląd postępu:
zakładka **Actions** w repo.

### 4. Otwórz apkę na telefonie
Po zakończeniu działania (2-3 minuty) adres będzie wyglądał tak:

```
https://<twoj-login>.github.io/plannity/
```

Otwórz go w przeglądarce na telefonie. Żeby wyglądało jak zainstalowana
aplikacja: w Chrome/Safari wybierz **"Dodaj do ekranu głównego"** —
dostaniesz ikonkę Plannity, która otwiera się w pełnym ekranie, bez paska
przeglądarki.

### 5. Załóż konta
Przy pierwszym wejściu zarejestrujcie oboje konta (zakładka "Rejestracja"
na ekranie logowania) — email + hasło, bez potwierdzania mailem. Oboje
widzicie te same, wspólne dane, zsynchronizowane między urządzeniami.

## Co jest w środku

- `src/lib/supabase.ts` — połączenie z bazą (ten sam projekt Supabase co
  wcześniej, klucz jest publiczny/"publishable" — bezpieczny do trzymania
  w kodzie frontendowym, bo wszystkie tabele mają włączone Row Level
  Security i wymagają zalogowania).
- `src/pages/` — pięć widoków: Dashboard (pogoda + rower), Plan Roczny,
  Nawyki, Obowiązki, Finanse.
- `src/lib/weather.ts` — pogoda pobierana bezpośrednio z przeglądarki
  z darmowego Open-Meteo (bez klucza), cache w `sessionStorage` na 10 min.
- `supabase/schema.sql` — pełny schemat + dane startowe, czysto jako
  dokumentacja/backup (nie trzeba uruchamiać, baza już istnieje i działa).
- `.github/workflows/deploy.yml` — automatyczny build + publikacja na
  GitHub Pages przy każdym pushu do `main`.

## Rozwój lokalny (opcjonalnie)

```bash
npm install
npm run dev
```

## Uwaga co do weryfikacji

Ten kod nie mógł zostać zbudowany (`npm run build`) w środowisku, w którym
powstał, bo nie miało ono dostępu do rejestru npm. Został za to sprawdzony
pod kątem błędów składniowych TypeScript/JSX (type-check przeszedł bez
błędów składniowych) i jest bezpośrednią, linia-po-linii przeniesioną
wersją logiki z działającej wcześniej aplikacji w Lovable (ten sam schemat
bazy, te same zapytania, te same komponenty). Mimo to: po pierwszym pushu
sprawdź zakładkę **Actions** w repo — jeśli `npm install`/`npm run build`
się nie powiedzie, log w Actions pokaże dokładnie co i gdzie, i można to
doszlifować.
