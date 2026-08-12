// Jednorázové vygenerování offline hlasového balíčku do public/voice/.
// Spuštění: npm run generate:voice (klíč čte z .env — VITE_OPENAI_API_KEY).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const MODEL = "gpt-4o-mini-tts";
const VOICE_NAME = "sage";
const URL = "https://api.openai.com/v1/audio/speech";

const CLIPS = {
  en: { inhale: "Inhale", hold: "Hold", exhale: "Exhale" },
  cs: { inhale: "Nádech", hold: "Zadržet", exhale: "Výdech" },
};

// Instrukce psané v jazyce klipu vedou model k rodilé výslovnosti daného jazyka.
const STYLE_INSTRUCTIONS = {
  en: `Voice: a yoga instructor whispering to students resting in savasana at the end of an evening class.
Delivery: an intimate, hushed whisper — barely above a breath, as if not to wake anyone in the room.
Almost no vocal cord engagement; mostly soft air.
Pacing: extremely slow. Stretch every syllable far longer than normal speech. Never rush or blurt the word out.
Let the word float out gradually on a long exhale, with a soft onset and a slow, gentle fade at the end.
Tone: warm, tender, caring, deeply calm and reassuring.
Pronounce the word as natural native English.
Say only the given word, once, with nothing added.`,
  cs: `Jsi rodilá česká lektorka jógy. Na konci večerní lekce šeptáš studentům ležícím v šavásaně jediné slovo.
Mluvíš výhradně přirozenou rodilou češtinou s dokonalou českou výslovností všech hlásek (ř, ž, ch, dlouhé samohlásky). Žádný cizí přízvuk.
Podání: důvěrný tichý šepot, téměř jen dech, skoro bez zapojení hlasivek — jako bys nechtěla nikoho v místnosti probudit.
Tempo: extrémně pomalé. Každou slabiku výrazně protáhni, mnohem déle než v běžné řeči. Slovo nikdy nevyhrkni rychle.
Nech slovo pomalu vyplynout na dlouhém výdechu, s měkkým začátkem a pozvolným, jemným dozněním.
Tón: vřelý, něžný, laskavý, hluboce uklidňující.
Řekni pouze zadané slovo, jednou, nic nepřidávej.`,
};

async function readApiKey() {
  if (process.env.VITE_OPENAI_API_KEY?.trim()) return process.env.VITE_OPENAI_API_KEY.trim();
  const env = await readFile(path.join(ROOT, ".env"), "utf8");
  const match = env.match(/^VITE_OPENAI_API_KEY=(.+)$/m);
  const key = match?.[1]?.trim();
  if (!key) {
    console.error("Chybí VITE_OPENAI_API_KEY v .env — vložte klíč a spusťte znovu.");
    process.exit(1);
  }
  return key;
}

async function generate(apiKey, text, instructions) {
  const res = await fetch(URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE_NAME,
      input: text,
      instructions,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI TTS ${res.status} ${res.statusText}: ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const apiKey = await readApiKey();

for (const [lang, phrases] of Object.entries(CLIPS)) {
  const dir = path.join(ROOT, "public", "voice", lang);
  await mkdir(dir, { recursive: true });
  for (const [key, text] of Object.entries(phrases)) {
    const file = path.join(dir, `${key}.mp3`);
    process.stdout.write(`Generuji ${lang}/${key}.mp3 („${text}")… `);
    const audio = await generate(apiKey, text, STYLE_INSTRUCTIONS[lang]);
    await writeFile(file, audio);
    console.log(`OK (${(audio.length / 1024).toFixed(1)} kB)`);
  }
}

console.log("\nHotovo — balíček je v public/voice/. Aplikace ho použije automaticky (backend static).");
