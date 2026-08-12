import type { Language } from "../types";
import type { LoadedVoiceBackend } from "./types";
import { phaseTexts } from "./types";

/** Progress ring uses fixed 4-7-8 pacing; playback completes on utterance end or safety timeout. */
const UI_SECONDS: Record<string, number> = {
  inhale: 4,
  hold: 7,
  exhale: 8,
};

export class WebSpeechVoiceBackend implements LoadedVoiceBackend {
  readonly id = "webspeech" as const;
  private readonly texts: Record<string, string>;
  private cancelled = false;

  constructor(
    private readonly lang: Language,
    private readonly voice: SpeechSynthesisVoice,
  ) {
    this.texts = phaseTexts(lang) as Record<string, string>;
  }

  getDurationSec(key: string): number {
    return UI_SECONDS[key] ?? 4;
  }

  async play(key: string, _ctx: AudioContext, _gain: GainNode): Promise<void> {
    const text = this.texts[key];
    if (!text || typeof window.speechSynthesis === "undefined") {
      return Promise.resolve();
    }

    this.cancelled = false;
    window.speechSynthesis.cancel();

    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this.lang === "cs" ? "cs-CZ" : "en-US";
      utter.voice = this.voice;
      utter.rate = 0.48;
      utter.pitch = 0.74;
      utter.volume = 0.66;
      const maxMs = (UI_SECONDS[key] ?? 6) * 2500;
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(safety);
        resolve();
      };
      const safety = window.setTimeout(finish, maxMs);
      utter.onend = () => {
        if (!this.cancelled) finish();
      };
      utter.onerror = () => finish();
      window.speechSynthesis.speak(utter);
    });
  }

  static waitForVoices(): Promise<void> {
    if (window.speechSynthesis.getVoices().length > 0) return Promise.resolve();

    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        window.speechSynthesis.onvoiceschanged = null;
        resolve();
      }, 800);

      window.speechSynthesis.onvoiceschanged = () => {
        window.clearTimeout(timeout);
        window.speechSynthesis.onvoiceschanged = null;
        resolve();
      };
    });
  }

  stopPlayback(): void {
    this.cancelled = true;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

function normalizeLang(lang: string): string {
  return lang.toLowerCase().replace("_", "-");
}

function pickStrictVoice(lang: Language): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const targetLangs = lang === "cs" ? ["cs-cz", "cs"] : ["en-us", "en-gb", "en-au", "en-ie", "en-za", "en"];
  const candidates = voices.filter((voice) => {
    const voiceLang = normalizeLang(voice.lang);
    return targetLangs.some((target) => voiceLang === target || voiceLang.startsWith(`${target}-`));
  });

  const preferredNames =
    lang === "cs"
      ? ["zuzana", "tereza", "iveta", "natural", "google", "microsoft"]
      : [
          "samantha",
          "ava",
          "allison",
          "serena",
          "victoria",
          "karen",
          "moira",
          "fiona",
          "daniel",
          "jamie",
          "natural",
          "google",
          "microsoft",
        ];

  for (const name of preferredNames) {
    const match = candidates.find((voice) => voice.name.toLowerCase().includes(name));
    if (match) return match;
  }

  return candidates[0] ?? null;
}

export async function createWebSpeechVoiceBackend(lang: Language, onProgress: (msg: string) => void): Promise<WebSpeechVoiceBackend> {
  if (typeof window.speechSynthesis === "undefined") {
    throw new Error("Web Speech API is not available in this environment.");
  }
  await WebSpeechVoiceBackend.waitForVoices();
  const voice = pickStrictVoice(lang);
  if (!voice) {
    throw new Error(
      lang === "en"
        ? "No English browser voice is available. Use OpenAI or add an offline voice pack."
        : "V prohlížeči není dostupný český hlas. Použijte OpenAI nebo offline hlasový balíček.",
    );
  }
  onProgress(lang === "en" ? `Using browser voice: ${voice.name}` : `Používá se hlas prohlížeče: ${voice.name}`);
  return new WebSpeechVoiceBackend(lang, voice);
}
