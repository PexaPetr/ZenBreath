export enum BreathingPhase {
  INHALE = "INHALE",
  HOLD = "HOLD",
  EXHALE = "EXHALE",
  OUTRO = "OUTRO",
  IDLE = "IDLE",
}

export type Language = "en" | "cs";

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  phase: BreathingPhase;
  cycle: number;
  language: Language;
}
