# ZenBreath

Webová aplikace postavená na [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript — vhodný základ pro kód exportovaný z [Google AI Studio](https://aistudio.google.com/).

## Požadavky

- [Node.js](https://nodejs.org/) (LTS, např. 20 nebo 22)
- npm (součást Node)

## Lokální vývoj

```bash
npm install
npm run dev
```

Otevřete v prohlížeči adresu, kterou Vite vypíše (obvykle `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

Výstup produkčního buildu je ve složce `dist/`.

## Proměnné prostředí

Zkopírujte `.env.example` na `.env` a doplňte hodnoty. Soubor `.env` je v `.gitignore` a na GitHub se necommituje.

## GitHub a deploy

1. Commitněte změny a pushněte na `origin` (`main`).
2. Na [Vercel](https://vercel.com/), [Netlify](https://www.netlify.com/) nebo [Cloudflare Pages](https://pages.cloudflare.com/) připojte tento repozitář.
3. Nastavení buildu obvykle: **Build command** `npm run build`, **Output** `dist`.
4. Na hostingu přidejte stejné env proměnné jako v `.env` (např. `VITE_GEMINI_API_KEY`).

## Šablona AI Studio

Původní GitHub banner z AI Studia je v souboru `README.ai-studio-template.md`.
