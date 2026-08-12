import { BreathingPhase, type Language } from "../types";

interface Props {
  phase: BreathingPhase;
  language: Language;
  progress: number;
}

export default function BreathingVisual({ phase, language, progress }: Props) {
  const isEn = language === "en";

  const getDynamicScale = () => {
    switch (phase) {
      case BreathingPhase.INHALE:
        if (progress < 0.25) {
          const slowPulse = Math.sin(progress * Math.PI * 4) * 0.02;
          return 1.0 + progress * 0.2 + slowPulse;
        }
        const stage2Progress = (progress - 0.25) / 0.75;
        return 1.05 + stage2Progress * 0.55;

      case BreathingPhase.HOLD:
        return 1.6;

      case BreathingPhase.EXHALE: {
        const baseExhaleScale = 0.8 + progress * 0.3;
        const exhalePulse = Math.sin(progress * Math.PI * 10) * (0.02 * progress);
        return baseExhaleScale + exhalePulse;
      }

      case BreathingPhase.OUTRO:
        return 1.0;

      default:
        return 1.0;
    }
  };

  const getGlowConfig = () => {
    const baseSaturation = 0.05 + progress * 0.95;

    if (phase === BreathingPhase.INHALE) {
      if (progress < 0.25) {
        return {
          opacity: 0.1 + progress * 0.3,
          glowSpread: 30 + progress * 40,
          saturation: 1.1 + progress,
        };
      }
      const stage2Progress = (progress - 0.25) / 0.75;
      return {
        opacity: 0.175 + stage2Progress * 0.725,
        glowSpread: 70 + stage2Progress * 70,
        saturation: 1.35 + stage2Progress * 0.65,
      };
    }

    if (phase === BreathingPhase.EXHALE) {
      return {
        opacity: 0.15 + progress * 0.45,
        glowSpread: 50 + progress * 40,
        saturation: 1.1 + progress * 0.5,
      };
    }

    return {
      opacity: phase === BreathingPhase.IDLE ? 0.01 : baseSaturation * 0.9,
      glowSpread: 80,
      saturation: 1.2 + progress * 0.8,
    };
  };

  const getPhaseConfig = () => {
    switch (phase) {
      case BreathingPhase.INHALE:
        return {
          label: isEn ? "Inhale" : "Nádech",
          colorClass: "bg-orange-500",
          glowBase: "rgba(249, 115, 22,",
        };
      case BreathingPhase.HOLD:
        return {
          label: isEn ? "Hold" : "Zadržet",
          colorClass: "bg-orange-600",
          glowBase: "rgba(234, 88, 12,",
        };
      case BreathingPhase.EXHALE:
        return {
          label: isEn ? "Exhale" : "Výdech",
          colorClass: "bg-orange-400",
          glowBase: "rgba(251, 146, 60,",
        };
      case BreathingPhase.OUTRO:
        return {
          label: isEn ? "Rest" : "Klid",
          colorClass: "bg-white",
          glowBase: "rgba(255, 255, 255,",
        };
      default:
        return {
          label: "",
          colorClass: "bg-slate-800",
          glowBase: "rgba(0,0,0,",
        };
    }
  };

  const config = getPhaseConfig();
  const glowConfig = getGlowConfig();
  const dynamicScale = getDynamicScale();

  return (
    <div className="relative flex items-center justify-center w-96 h-96 select-none">
      <div
        className="absolute inset-0 rounded-full blur-[140px] transition-all duration-300 ease-out bg-orange-500"
        style={{
          opacity: phase === BreathingPhase.IDLE ? 0.01 : glowConfig.opacity * 0.15,
          transform: `scale(${dynamicScale * 1.5})`,
        }}
      />
      <div className="absolute w-[100%] h-[100%] border border-white/5 rounded-full animate-[spin_120s_linear_infinite] opacity-30" />
      <div className="absolute w-[80%] h-[80%] border border-white/[0.04] rounded-full animate-[spin_80s_linear_infinite_reverse]" />
      <div
        className="relative w-60 h-60 flex items-center justify-center will-change-transform"
        style={{
          transform: `scale(${dynamicScale})`,
          transition:
            phase === BreathingPhase.HOLD ? "transform 1000ms ease-in-out" : "transform 150ms cubic-bezier(0.2, 0, 0.4, 1)",
        }}
      >
        <div className="absolute inset-0 rounded-full border border-white/10 bg-[#080a0f] shadow-inner" />
        <div
          className={`absolute inset-0 rounded-full transition-all duration-150 ${config.colorClass}`}
          style={{
            opacity: glowConfig.opacity,
            transform: `scale(${0.94 + progress * 0.04})`,
            boxShadow: `0 0 ${glowConfig.glowSpread}px ${config.glowBase}${glowConfig.opacity * 0.8})`,
            filter: `saturate(${glowConfig.saturation}) contrast(1.1)`,
          }}
        />
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-white font-serif italic text-3xl tracking-tight transition-all duration-500 drop-shadow-lg text-center">
            {config.label}
          </span>
          {phase !== BreathingPhase.IDLE && phase !== BreathingPhase.OUTRO && (
            <div className="flex space-x-1.5 mt-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${progress > i / 4 ? "bg-white w-5" : "bg-white/10 w-2"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <svg className="absolute w-full h-full -rotate-90 pointer-events-none opacity-40" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeDasharray="301.59"
          strokeDashoffset={301.59 - progress * 301.59}
          className={`text-orange-400 transition-all duration-100 ease-linear ${phase === BreathingPhase.IDLE ? "opacity-0" : "opacity-100"}`}
        />
      </svg>
    </div>
  );
}
