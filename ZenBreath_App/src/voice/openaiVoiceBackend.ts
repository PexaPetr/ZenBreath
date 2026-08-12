import type { Language } from "../types";
import { ttsService } from "../services/ttsService";
import { BufferMapVoiceBackend } from "./bufferMapVoiceBackend";
import { VOICE_KEYS, phaseTexts } from "./types";

export async function createOpenAiVoiceBackend(
  ctx: AudioContext,
  lang: Language,
  onProgress: (msg: string) => void,
): Promise<BufferMapVoiceBackend> {
  const isEn = lang === "en";
  const texts = phaseTexts(lang);
  onProgress(isEn ? "Syncing OpenAI voice…" : "Synchronizace hlasu (OpenAI)…");

  const buffers = new Map<string, AudioBuffer>();

  for (const key of VOICE_KEYS) {
    const audioData = await ttsService.generateSpeech(texts[key]);
    const buffer = await ttsService.decodeToAudioBuffer(audioData, ctx);
    buffers.set(key, buffer);
  }

  return new BufferMapVoiceBackend("openai", buffers);
}
