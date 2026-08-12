import type { Language } from "../types";

export type VoiceKey = "inhale" | "hold" | "exhale";

export const VOICE_KEYS: VoiceKey[] = ["inhale", "hold", "exhale"];

export type VoiceBackendId = "static" | "openai" | "webspeech";

/** Active voiced backend (not silent / not voiceless timers). */
export interface LoadedVoiceBackend {
  readonly id: VoiceBackendId;
  getDurationSec(key: string): number;
  play(key: string, ctx: AudioContext, gain: GainNode): Promise<void>;
  stopPlayback(): void;
}

export function phaseTexts(lang: Language): Record<VoiceKey, string> {
  const isEn = lang === "en";
  return {
    inhale: isEn ? "Inhale" : "Nádech",
    hold: isEn ? "Hold" : "Zadržet",
    exhale: isEn ? "Exhale" : "Výdech",
  };
}
