import { useState, useEffect, useRef, useCallback } from "react";
import { BreathingPhase, type Language } from "./types";
import { audioEngine } from "./services/audioEngine";
import BreathingVisual from "./components/BreathingVisual";

interface DurationSliderProps {
  value: number;
  onChange: (val: number) => void;
  language: Language;
}

function DurationSlider({ value, onChange, language }: DurationSliderProps) {
  return (
    <div className="space-y-8 px-6 text-left">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">
          {language === "en" ? "Practice Time" : "Doba cvičení"}
        </span>
        <span className="text-3xl font-serif italic text-white">{value}m</span>
      </div>
      <div className="relative group pt-1">
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-full h-[3px] bg-white/5 rounded-full appearance-none cursor-pointer accent-orange-500 transition-all hover:bg-white/10"
        />
        <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[9px] text-slate-800 font-bold tracking-widest uppercase">
          <span>1m</span>
          <span>10m</span>
          <span>20m</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<BreathingPhase>(BreathingPhase.IDLE);
  const [durationMins, setDurationMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const [loadingMsg, setLoadingMsg] = useState("Initializing...");
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const timeLeftRef = useRef(0);

  const stopSession = useCallback(() => {
    sessionActiveRef.current = false;
    setPhase(BreathingPhase.IDLE);
    audioEngine.stopAll();
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setCycle(0);
    setProgress(0);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (sessionActiveRef.current) stopSession();
      setIsLoading(true);
      setIsLoaded(false);
      try {
        await audioEngine.loadAssets(language, (msg) => setLoadingMsg(msg));
        setIsLoaded(true);
      } catch {
        setLoadingMsg(language === "en" ? "Error loading voice." : "Chyba při načítání hlasu.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      audioEngine.stopAll();
    };
  }, [language, stopSession]);

  const runPhase = async (p: BreathingPhase, voiceKey: string) => {
    if (!sessionActiveRef.current) return;
    setPhase(p);
    setProgress(0);
    const bufferDuration = audioEngine.getBufferDuration(voiceKey);
    const durationMs = (bufferDuration || 1) * 1000;
    const startTime = Date.now();
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    const voicePromise = audioEngine.playVoice(voiceKey);
    await new Promise<void>((resolve) => {
      const interval = window.setInterval(() => {
        if (!sessionActiveRef.current) {
          window.clearInterval(interval);
          resolve();
          return;
        }
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min(elapsed / durationMs, 1);
        setProgress(currentProgress);
      }, 30);
      progressIntervalRef.current = interval;
      void voicePromise.then(() => {
        if (progressIntervalRef.current === interval) {
          window.clearInterval(interval);
          progressIntervalRef.current = null;
        }
        setProgress(1);
        resolve();
      });
    });
  };

  const runSession = async () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);

    let currentCycle = 1;
    while (sessionActiveRef.current && timeLeftRef.current > 0) {
      setCycle(currentCycle);
      await runPhase(BreathingPhase.INHALE, "inhale");
      if (!sessionActiveRef.current) break;
      await runPhase(BreathingPhase.HOLD, "hold");
      if (!sessionActiveRef.current) break;
      await runPhase(BreathingPhase.EXHALE, "exhale");
      if (!sessionActiveRef.current) break;
      currentCycle++;
    }
    if (sessionActiveRef.current) {
      setPhase(BreathingPhase.OUTRO);
      setProgress(1);
      await runPhase(BreathingPhase.OUTRO, "outro");
      stopSession();
    }
  };

  const startSession = async () => {
    if (sessionActiveRef.current) return;
    await audioEngine.init();
    sessionActiveRef.current = true;
    const totalSecs = durationMins * 60;
    timeLeftRef.current = totalSecs;
    setTimeLeft(totalSecs);
    void runSession();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-orange-900/10 blur-[150px] rounded-full breathe-bg transition-opacity duration-1000"
          style={{ opacity: phase !== BreathingPhase.IDLE ? 0.9 : 0.3 }}
        />
        <div
          className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-indigo-900/10 blur-[150px] rounded-full breathe-bg transition-opacity duration-1000"
          style={{ animationDelay: "3s", opacity: phase !== BreathingPhase.IDLE ? 0.9 : 0.3 }}
        />
      </div>
      <div className="z-10 w-full max-w-xl flex flex-col items-center text-center space-y-16">
        <header className="space-y-3">
          <h1 className="text-6xl md:text-7xl font-serif italic text-white tracking-tight drop-shadow-2xl">ZenBreath</h1>
          <p className="text-slate-500 font-light tracking-[0.4em] uppercase text-[11px] opacity-80">
            {language === "en" ? "Sleep Preparation" : "Příprava na spánek"}
          </p>
        </header>
        <div className="relative py-4">
          {isLoaded ? (
            <BreathingVisual phase={phase} language={language} progress={progress} />
          ) : (
            <div className="w-80 h-80 flex flex-col items-center justify-center space-y-8">
              <div className="w-12 h-12 border-[3px] border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-[10px] text-slate-600 italic tracking-[0.2em] uppercase animate-pulse">{loadingMsg}</p>
            </div>
          )}
          {phase !== BreathingPhase.IDLE && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full">
              <p className="text-4xl font-serif text-white/95 tabular-nums tracking-widest">{formatTime(timeLeft)}</p>
              {cycle > 0 && phase !== BreathingPhase.OUTRO && (
                <p className="text-[10px] uppercase tracking-[0.4em] text-orange-500/50 mt-3 font-semibold">
                  {language === "en" ? `Cycle ${cycle}` : `Cyklus ${cycle}`}
                </p>
              )}
            </div>
          )}
        </div>
        {phase === BreathingPhase.IDLE && (
          <div
            className={`w-full max-w-sm space-y-14 transition-all duration-1000 transform ${isLoading ? "opacity-10 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
          >
            <div className="flex justify-center space-x-4">
              {(["en", "cs"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-8 py-2.5 text-[10px] uppercase tracking-[0.3em] rounded-full border transition-all duration-500 ${language === lang ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"}`}
                >
                  {lang === "en" ? "English" : "Čeština"}
                </button>
              ))}
            </div>
            <DurationSlider value={durationMins} onChange={setDurationMins} language={language} />
            <button
              type="button"
              onClick={() => void startSession()}
              disabled={!isLoaded}
              className="group relative w-full py-6 bg-white text-black rounded-full font-bold uppercase tracking-[0.3em] text-[11px] transition-all duration-500 hover:scale-[1.04] active:scale-95 disabled:opacity-10 shadow-[0_25px_50px_-12px_rgba(255,255,255,0.15)] overflow-hidden"
            >
              <span className="relative z-10">{language === "en" ? "Begin Journey" : "Začít cestu"}</span>
              <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
            </button>
          </div>
        )}
        {phase !== BreathingPhase.IDLE && (
          <button
            type="button"
            onClick={stopSession}
            className="px-12 py-4 border border-white/5 rounded-full text-slate-600 text-[11px] uppercase tracking-[0.4em] hover:bg-white/5 hover:text-slate-200 hover:border-white/20 transition-all duration-700"
          >
            {language === "en" ? "End Practice" : "Ukončit"}
          </button>
        )}
      </div>
      <footer className="absolute bottom-12 text-center w-full px-6 opacity-30 pointer-events-none">
        <p className="text-[10px] text-slate-700 uppercase tracking-[0.5em] max-w-sm mx-auto leading-relaxed italic">
          {language === "en"
            ? "Monotone clinical guidance for neural calm"
            : "Monotónní klinické vedení pro neuronální klid"}
        </p>
      </footer>
    </div>
  );
}
