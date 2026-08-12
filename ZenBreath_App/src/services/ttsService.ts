// "sage" is a calm, soothing OpenAI voice — fits whispered meditative guidance.
const VOICE_NAME = "sage";
const MODEL = "gpt-4o-mini-tts";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export function isOpenAiApiKeyPresent(): boolean {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Chybí VITE_OPENAI_API_KEY. Zkopírujte .env.example do .env a vložte klíč z platform.openai.com.",
    );
  }
  return key.trim();
}

const STYLE_INSTRUCTIONS = `Voice: a yoga instructor whispering to students resting in savasana at the end of an evening class.
Delivery: an intimate, hushed whisper — barely above a breath, as if not to wake anyone in the room.
Almost no vocal cord engagement; mostly soft air. Very quiet, very slow, stretched out and unhurried.
Tone: warm, tender, caring, deeply calm and reassuring.
Language: pronounce the word as a native speaker of the word's language (natural native English or natural native Czech).
Pacing: let the word float out slowly on an exhale, with softness at the beginning and a gentle fade at the end.
Never sound energetic, instructive, theatrical, or like normal spoken volume.
Say only the given word, once, with nothing added.`;

export class TTSService {
  /** Returns encoded audio (mp3) — decode with `decodeToAudioBuffer`. */
  async generateSpeech(text: string): Promise<ArrayBuffer> {
    const response = await fetch(OPENAI_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        voice: VOICE_NAME,
        input: text,
        instructions: STYLE_INSTRUCTIONS,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      let detail = `${response.status} ${response.statusText}`;
      try {
        const err = (await response.json()) as { error?: { message?: string } };
        if (err.error?.message) detail = err.error.message;
      } catch {
        /* keep status text */
      }
      throw new Error(`OpenAI TTS: ${detail}`);
    }

    return response.arrayBuffer();
  }

  async decodeToAudioBuffer(data: ArrayBuffer, ctx: AudioContext): Promise<AudioBuffer> {
    return ctx.decodeAudioData(data.slice(0));
  }
}

export const ttsService = new TTSService();
