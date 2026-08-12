import { isOpenAiApiKeyPresent } from "../services/ttsService";
import type { Language } from "../types";
import type { LoadedVoiceBackend, VoiceBackendId } from "./types";
import { createOpenAiVoiceBackend } from "./openaiVoiceBackend";
import { tryCreateStaticVoiceBackend } from "./staticVoiceBackend";
import { createWebSpeechVoiceBackend } from "./webSpeechVoiceBackend";

const ALLOWED: readonly VoiceBackendId[] = ["static", "openai", "webspeech"];
const DEFAULT_PRIORITY: VoiceBackendId[] = ["static", "openai"];

function parsePriority(): VoiceBackendId[] {
  const raw = import.meta.env.VITE_VOICE_PRIORITY?.trim();
  if (!raw) return DEFAULT_PRIORITY;
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is VoiceBackendId => ALLOWED.includes(s as VoiceBackendId));
  return parts.length > 0 ? parts : DEFAULT_PRIORITY;
}

/**
 * Hybrid voice stack (plan E): try backends in `VITE_VOICE_PRIORITY` order.
 * Default is `static,openai` because browser voices often sound wrong for meditation.
 */
export async function resolveVoiceBackend(
  ctx: AudioContext,
  lang: Language,
  onProgress: (msg: string) => void,
): Promise<LoadedVoiceBackend> {
  const order = parsePriority();
  let lastError: Error | null = null;

  for (const id of order) {
    try {
      if (id === "static") {
        const backend = await tryCreateStaticVoiceBackend(ctx, lang, onProgress);
        if (backend) return backend;
      } else if (id === "openai") {
        if (!isOpenAiApiKeyPresent()) continue;
        return await createOpenAiVoiceBackend(ctx, lang, onProgress);
      } else if (id === "webspeech") {
        return await createWebSpeechVoiceBackend(lang, onProgress);
      }
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("No voice backend could be initialized.");
}
