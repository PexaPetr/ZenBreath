import type { Language } from "../types";
import { BufferMapVoiceBackend } from "./bufferMapVoiceBackend";
import { VOICE_KEYS } from "./types";

const EXTENSIONS = [".mp3", ".webm", ".ogg"] as const;

async function fetchFirstDecodable(ctx: AudioContext, urls: string[]): Promise<AudioBuffer | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) continue;
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      if (buf.duration > 0.05) return buf;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Loads `/voice/{lang}/{key}.{ext}` if all four clips exist.
 * Returns null if any clip is missing (hybrid chain continues).
 */
export async function tryCreateStaticVoiceBackend(
  ctx: AudioContext,
  lang: Language,
  onProgress: (msg: string) => void,
): Promise<BufferMapVoiceBackend | null> {
  const isEn = lang === "en";
  onProgress(isEn ? "Checking bundled voice…" : "Kontrola vestavěného hlasu…");

  const buffers = new Map<string, AudioBuffer>();

  for (const key of VOICE_KEYS) {
    const urls = EXTENSIONS.map((ext) => `${import.meta.env.BASE_URL}voice/${lang}/${key}${ext}`);
    const buf = await fetchFirstDecodable(ctx, urls);
    if (!buf) {
      buffers.clear();
      return null;
    }
    buffers.set(key, buf);
  }

  onProgress(isEn ? "Using offline voice pack." : "Používá se offline balíček hlasu.");
  return new BufferMapVoiceBackend("static", buffers);
}
