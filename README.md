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

Zkopírujte `.env.example` na `.env` a nastavte **`VITE_GEMINI_API_KEY`** (stejný klíč jako v Google AI Studio pro Gemini). Bez něj TTS (`gemini-2.5-flash-preview-tts`) nepoběží.

**Bezpečnost:** Klíč v prohlížeči je viditelný ve zdrojáku buildu — pro veřejný web používejte spíš proxy na serveru nebo omezení klíče v Google Cloud.

## GitHub a deploy

1. Push na `main` (repozitář `PexaPetr/ZenBreath`). Volitelný GitHub Actions workflow vyžaduje u PAT oprávnění **workflow**.
2. **Vercel:** Import Project → vyberte repo → Node 20+ (viz `.nvmrc`). Build a výstup jsou v [`vercel.json`](vercel.json); po importu často stačí potvrdit výchozí nastavení.
3. **Netlify:** Add new site → Import from Git → build `npm run build`, publish `dist` (nebo použijte [`netlify.toml`](netlify.toml)).
4. **Cloudflare Pages:** Framework preset *Vite*, build `npm run build`, output `dist`.
5. V nastavení hostingu přidejte env proměnné jako v `.env` (např. `VITE_GEMINI_API_KEY`).

## Šablona AI Studio

Původní GitHub banner z AI Studia je v souboru `README.ai-studio-template.md`.
