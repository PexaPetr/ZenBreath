# ZenBreath_App

Aplikace podle [PRD.md](./PRD.md) — Vite 6, React 19, TypeScript, Tailwind 4, volitelný OpenAI TTS a **režim bez hlasu** (4–7–8).

## Požadavky

- Node.js 20+
- npm

## Vývoj

Z kořene této složky:

```bash
npm install
npm run dev
```

Vite naslouchá na portu **3000** (viz `vite.config.ts`).

## Proměnné prostředí

Zkopírujte `.env.example` na `.env`.

- **`VITE_OPENAI_API_KEY`** — volitelné; pokud je v řetězci backendů `openai`, načte se neuralní hlas přes OpenAI TTS (`gpt-4o-mini-tts`).
- **`VITE_VOICE_PRIORITY`** — volitelné; výchozí je `static,openai`. Aplikace zkouší backendy v tomto pořadě:
  - **static** — soubory v `public/voice/{en|cs}/inhale|hold|exhale.{mp3|webm|ogg}` (bez API, viz [`public/voice/README.md`](public/voice/README.md)).
  - **openai** — generování za běhu (potřebuje klíč).
  - **webspeech** — volitelný Web Speech API fallback; zapínejte jen přes `VITE_VOICE_PRIORITY`, kvalita a výslovnost závisí na OS.

Bez klíče a bez offline balíčku aplikace nabídne režim **bez hlasu** (4–7–8), aby nepoužila špatný systémový hlas.

**Bezpečnost:** klíč v klientském buildu je viditelný — pro veřejný provoz zvažte serverovou proxy (PRD F7) nebo primárně **static** audio.

## Build

```bash
npm run build
npm run preview
```

## Související

- Původní monolit v nadřazeném repozitáři: `../` (root `ZenBreath`).
