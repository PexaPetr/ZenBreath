import { BreathingPhase, type Language } from "../types";

interface Props {
  phase: BreathingPhase;
  language: Language;
  progress: number;
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 1.5;

const PHASE_TOTAL_SECONDS: Partial<Record<BreathingPhase, number>> = {
  [BreathingPhase.INHALE]: 4,
  [BreathingPhase.HOLD]: 7,
  [BreathingPhase.EXHALE]: 8,
};

const RING_RADIUS = 47;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function BreathingVisual({ phase, language, progress }: Props) {
  const isEn = language === "en";

  const getScale = () => {
    const eased = easeInOutSine(progress);
    switch (phase) {
      case BreathingPhase.INHALE:
        return MIN_SCALE + eased * (MAX_SCALE - MIN_SCALE);
      case BreathingPhase.HOLD:
        return MAX_SCALE;
      case BreathingPhase.EXHALE:
        return MAX_SCALE - eased * (MAX_SCALE - MIN_SCALE);
      default:
        return MIN_SCALE;
    }
  };

  // Soft lavender-blue family throughout — hue drifts gently per phase (Calm-style).
  const getOrbConfig = () => {
    switch (phase) {
      case BreathingPhase.INHALE:
        return {
          label: isEn ? "Inhale" : "Nádech",
          core: "rgba(196, 181, 253, 0.55)",
          mid: "rgba(129, 140, 248, 0.40)",
          glow: "rgba(139, 130, 250, 0.30)",
          intensity: 0.45 + easeInOutSine(progress) * 0.55,
        };
      case BreathingPhase.HOLD:
        return {
          label: isEn ? "Hold" : "Zadržet",
          core: "rgba(216, 180, 254, 0.55)",
          mid: "rgba(167, 139, 250, 0.40)",
          glow: "rgba(167, 139, 250, 0.32)",
          intensity: 1,
        };
      case BreathingPhase.EXHALE:
        return {
          label: isEn ? "Exhale" : "Výdech",
          core: "rgba(147, 197, 253, 0.50)",
          mid: "rgba(99, 102, 241, 0.36)",
          glow: "rgba(99, 102, 241, 0.28)",
          intensity: 1 - easeInOutSine(progress) * 0.55,
        };
      default:
        return {
          label: "",
          core: "rgba(148, 163, 184, 0.16)",
          mid: "rgba(100, 116, 139, 0.10)",
          glow: "rgba(100, 116, 139, 0.08)",
          intensity: 0.35,
        };
    }
  };

  const scale = getScale();
  const orb = getOrbConfig();
  const isIdle = phase === BreathingPhase.IDLE;

  const totalSeconds = PHASE_TOTAL_SECONDS[phase];
  const secondsLeft =
    totalSeconds !== undefined ? Math.max(1, Math.ceil(totalSeconds * (1 - progress))) : null;

  const softTransition =
    phase === BreathingPhase.HOLD
      ? "transform 1400ms cubic-bezier(0.65, 0, 0.35, 1)"
      : "transform 450ms cubic-bezier(0.65, 0, 0.35, 1)";

  return (
    <div className="relative flex items-center justify-center w-96 max-w-[90vw] h-96 max-h-[min(24rem,70vw)] select-none pointer-events-none">
      {/* Distant ambient halo */}
      <div
        className="absolute inset-[-20%] rounded-full blur-[110px] transition-opacity duration-[1500ms]"
        style={{
          background: `radial-gradient(circle, ${orb.glow} 0%, transparent 70%)`,
          opacity: isIdle ? 0.25 : 0.35 + orb.intensity * 0.5,
          transform: `scale(${scale * 1.15})`,
          transition: `${softTransition}, opacity 1500ms ease`,
        }}
      />
      {/* Orb — hazy sphere with no hard edge */}
      <div
        className="relative w-64 h-64 flex items-center justify-center will-change-transform"
        style={{ transform: `scale(${scale})`, transition: softTransition }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 32%, ${orb.core} 0%, ${orb.mid} 48%, transparent 74%)`,
            filter: "blur(14px)",
            opacity: isIdle ? 0.6 : 0.55 + orb.intensity * 0.45,
            transition: "opacity 1200ms ease, background 1200ms ease",
          }}
        />
        <div
          className="absolute inset-6 rounded-full"
          style={{
            background: `radial-gradient(circle at 42% 36%, ${orb.core} 0%, transparent 68%)`,
            filter: "blur(22px)",
            opacity: isIdle ? 0.4 : 0.4 + orb.intensity * 0.4,
            transition: "opacity 1200ms ease, background 1200ms ease",
          }}
        />
        <div
          className="relative z-10 flex flex-col items-center transition-opacity duration-1000"
          style={{ opacity: isIdle ? 0 : 0.9 }}
        >
          <span className="text-white/85 font-serif italic text-3xl tracking-wide text-center drop-shadow-[0_2px_18px_rgba(15,23,42,0.6)]">
            {orb.label}
          </span>
          {secondsLeft !== null && (
            <span
              className="mt-3 text-white/50 font-serif text-xl tabular-nums drop-shadow-[0_2px_12px_rgba(15,23,42,0.6)]"
              aria-label={
                isEn ? `${secondsLeft} seconds remaining` : `Zbývá ${secondsLeft} sekund`
              }
            >
              {secondsLeft}
            </span>
          )}
        </div>
      </div>
      {/* Soft progress ring — hazy light closing around the orb as the phase completes */}
      {!isIdle && (
        <svg
          className="absolute w-[88%] h-[88%] -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{ filter: "blur(1.6px)", opacity: 0.45 }}
        >
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(165, 180, 252, 0.16)"
            strokeWidth="1.6"
          />
          <circle
            cx="50"
            cy="50"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(196, 181, 253, 0.75)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            style={{ transition: "stroke-dashoffset 120ms linear" }}
          />
        </svg>
      )}
    </div>
  );
}
