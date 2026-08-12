import { GoogleGenAI, Modality } from "@google/genai";

const VOICE_NAME = "Fenrir";

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "Chybí VITE_GEMINI_API_KEY. Zkopírujte .env.example do .env a vložte klíč z Google AI Studio.",
    );
  }
  return key;
}

export class TTSService {
  private ai: GoogleGenAI | null = null;

  private client(): GoogleGenAI {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: getApiKey() });
    }
    return this.ai;
  }

  async generateSpeech(text: string): Promise<Uint8Array> {
    const prompt = `Act as a world-class meditation master. 
      Your voice is exceptionally deep, rich, and resonant—a warm, grounding vibration that feels like a physical presence. 
      Speak with profound calm and a slow, intentional rhythmic cadence. 
      Avoid a flat or monotone delivery; instead, use gentle, melodic inflections and natural breathing pauses to sound human and comforting. 
      Ensure every number counted is spoken with steady, clock-like precision, exactly one second apart. 
      Instruction: ${text}`;

    const response = await this.client().models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: VOICE_NAME },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");

    return this.decodeBase64(base64Audio);
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeToAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const ttsService = new TTSService();
