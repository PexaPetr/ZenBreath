import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BreathingPhase, type Language } from "./types";
import { audioEngine } from "./services/audioEngine";
import BreathingVisual from "./components/BreathingVisual";

interface DurationSliderProps {
  value: number;
  onChange: (val: number) => void;
  language: Language;
}

function DurationSlider({ value, onChange, language }: DurationSliderProps) {
  const label = language === "en" ? "Practice time in minutes" : "Doba cvičení v minutách";
  return (
    <div className="space-y-8 px-6 text-left">
      <div className="flex justify-between items-end">
        <span id="duration-slider-label" className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">
          {language === "en" ? "Practice Time" : "Doba cvičení"}
        </span>
        <span className="text-3xl font-serif italic text-white" aria-hidden="true">
          {value}m
        </span>
      </div>
      <div className="relative group pt-1">
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          aria-labelledby="duration-slider-label"
          aria-valuemin={1}
          aria-valuemax={20}
          aria-valuenow={value}
          aria-valuetext={`${value} ${language === "en" ? "minutes" : "minut"}`}
          className="w-full h-[3px] bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-300 transition-all hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300/80"
        />
        <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[9px] text-slate-800 font-bold tracking-widest uppercase" aria-hidden="true">
          <span>1m</span>
          <span>10m</span>
          <span>20m</span>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

type VoiceMode = "tts" | "silent";
type AssetBlock = "error" | null;

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M11 5 6.5 8.5H3v7h3.5L11 19V5z" />
      {muted ? (
        <>
          <line x1="16" y1="9.5" x2="21" y2="14.5" />
          <line x1="21" y1="9.5" x2="16" y2="14.5" />
        </>
      ) : (
        <>
          <path d="M14.5 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M17 7a7 7 0 0 1 0 10" />
        </>
      )}
    </svg>
  );
}

const PHASE_SECONDS: Record<string, number> = {
  inhale: 4,
  hold: 7,
  exhale: 8,
};

export default function App() {
  const [phase, setPhase] = useState<BreathingPhase>(BreathingPhase.IDLE);
  const [durationMins, setDurationMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const [loadingMsg, setLoadingMsg] = useState("Initializing...");
  const [cycle, setCycle] = useState(0);
  const [progress, setProgress] = useState(0);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("tts");
  const [assetBlock, setAssetBlock] = useState<AssetBlock>(null);
  const [loadErrorDetail, setLoadErrorDetail] = useState<string | null>(null);
  const [voiceBackendLabel, setVoiceBackendLabel] = useState<string | null>(null);
  const [voiceMuted, setVoiceMuted] = useState(false);

  const toggleVoiceMuted = () => {
    setVoiceMuted((prev) => {
      audioEngine.setMuted(!prev);
      return !prev;
    });
  };

  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const timeLeftRef = useRef(0);
  const cancelledRef = useRef(false);

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
    cancelledRef.current = false;

    const load = async () => {
      if (sessionActiveRef.current) stopSession();
      setAssetBlock(null);
      setLoadErrorDetail(null);
      setAssetsReady(false);

      if (voiceMode === "silent") {
        setVoiceBackendLabel(null);
        setAssetsLoading(true);
        setLoadingMsg(language === "en" ? "Preparing voiceless mode…" : "Příprava režimu bez hlasu…");
        try {
          await audioEngine.loadAssets(language, (msg) => setLoadingMsg(msg), "silent");
          if (!cancelledRef.current) {
            setAssetsReady(true);
            setVoiceBackendLabel("silent");
          }
        } catch {
          if (!cancelledRef.current) {
            setLoadingMsg(language === "en" ? "Could not prepare session." : "Nepodařilo se připravit cvičení.");
            setAssetBlock("error");
          }
        } finally {
          if (!cancelledRef.current) setAssetsLoading(false);
        }
        return;
      }

      setVoiceBackendLabel(null);
      setAssetsLoading(true);
      setLoadingMsg(language === "en" ? "Loading voice…" : "Načítání hlasu…");
      try {
        await audioEngine.loadAssets(language, (msg) => setLoadingMsg(msg), "tts");
        if (!cancelledRef.current) {
          setAssetsReady(true);
          setVoiceBackendLabel(audioEngine.getActiveVoiceBackendId());
        }
      } catch (e) {
        if (!cancelledRef.current) {
          setAssetBlock("error");
          setLoadErrorDetail(e instanceof Error ? e.message : String(e));
          setLoadingMsg(language === "en" ? "Voice could not be loaded." : "Hlas se nepodařilo načíst.");
        }
      } finally {
        if (!cancelledRef.current) setAssetsLoading(false);
      }
    };

    void load();

    return () => {
      cancelledRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      audioEngine.stopAll();
    };
  }, [language, voiceMode, stopSession]);

  const runPhase = async (p: BreathingPhase, voiceKey: string) => {
    if (!sessionActiveRef.current) return;
    setPhase(p);
    setProgress(0);
    const durationMs = (PHASE_SECONDS[voiceKey] ?? 4) * 1000;
    const startTime = Date.now();
    if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    void audioEngine.playVoice(voiceKey);
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
        if (currentProgress >= 1) {
          window.clearInterval(interval);
          if (progressIntervalRef.current === interval) {
            progressIntervalRef.current = null;
          }
          resolve();
        }
      }, 30);
      progressIntervalRef.current = interval;
    });
    setProgress(1);
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
    if (sessionActiveRef.current) stopSession();
  };

  const startSession = async () => {
    if (sessionActiveRef.current || !assetsReady) return;
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

  const ariaPhase = useMemo(() => {
    const en = language === "en";
    switch (phase) {
      case BreathingPhase.INHALE:
        return en ? "Inhale phase" : "Fáze nádechu";
      case BreathingPhase.HOLD:
        return en ? "Hold phase" : "Fáze zadržení dechu";
      case BreathingPhase.EXHALE:
        return en ? "Exhale phase" : "Fáze výdechu";
      default:
        return en ? "Ready" : "Připraveno";
    }
  }, [phase, language]);

  const retryVoiceLoad = () => {
    setVoiceMode("tts");
  };

  const switchToVoiceless = () => {
    setVoiceMode("silent");
  };

  const showIdleControls = phase === BreathingPhase.IDLE;

  return (
    <div className="min-h-[100dvh] bg-[#060812] text-slate-200 flex flex-col items-center justify-center px-6 py-4 relative overflow-x-hidden select-none">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {ariaPhase}
      </p>
      <div className="absolute inset-0 z-0">
        <div
          className="absolute top-[-15%] left-[-15%] w-[60%] h-[60%] bg-indigo-900/15 blur-[150px] rounded-full breathe-bg transition-opacity duration-1000"
          style={{ opacity: phase !== BreathingPhase.IDLE ? 0.9 : 0.3 }}
        />
        <div
          className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] bg-violet-900/10 blur-[150px] rounded-full breathe-bg transition-opacity duration-1000"
          style={{ animationDelay: "3s", opacity: phase !== BreathingPhase.IDLE ? 0.9 : 0.3 }}
        />
      </div>
      {assetsReady && voiceMode === "tts" && (
        <button
          type="button"
          onClick={toggleVoiceMuted}
          aria-pressed={voiceMuted}
          aria-label={
            voiceMuted
              ? language === "en" ? "Unmute voice" : "Zapnout hlas"
              : language === "en" ? "Mute voice" : "Vypnout hlas"
          }
          title={
            voiceMuted
              ? language === "en" ? "Unmute voice" : "Zapnout hlas"
              : language === "en" ? "Mute voice" : "Vypnout hlas"
          }
          className={`absolute top-6 right-6 z-20 p-3 rounded-full border transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${voiceMuted ? "border-white/15 text-slate-500 bg-white/5" : "border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20"}`}
        >
          <SpeakerIcon muted={voiceMuted} />
        </button>
      )}
      <div className="z-10 w-full max-w-xl flex flex-col items-center text-center space-y-6 md:space-y-16">
        <header className="space-y-2 md:space-y-3">
          <h1 className="text-4xl md:text-7xl font-serif italic text-white tracking-tight drop-shadow-2xl">ZenBreath</h1>
          <p className="text-slate-500 font-light tracking-[0.4em] uppercase text-[11px] opacity-80">
            {language === "en" ? "Sleep preparation" : "Příprava na spánek"}
          </p>
          {assetsReady && voiceMode === "silent" && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-300/70">
              {language === "en" ? "Voiceless 4-7-8" : "Bez hlasu 4-7-8"}
            </p>
          )}
          {assetsReady && voiceMode === "tts" && voiceBackendLabel && voiceBackendLabel !== "silent" && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400/70">
              {voiceBackendLabel === "static" &&
                (language === "en" ? "Offline voice pack" : "Offline hlasový balíček")}
              {voiceBackendLabel === "openai" && (language === "en" ? "OpenAI voice" : "Hlas OpenAI")}
              {voiceBackendLabel === "webspeech" &&
                (language === "en" ? "Browser voice (Web Speech)" : "Hlas prohlížeče (Web Speech)")}
            </p>
          )}
        </header>
        <div className="relative py-2 md:py-4">
          {assetsReady ? (
            <BreathingVisual phase={phase} language={language} progress={progress} />
          ) : (
            <div className="w-80 max-w-full min-h-[14rem] md:min-h-[20rem] flex flex-col items-center justify-center space-y-6 px-4">
              {assetsLoading && (
                <div className="w-12 h-12 border-[3px] border-indigo-400/10 border-t-indigo-400 rounded-full animate-spin" role="status" aria-label={loadingMsg} />
              )}
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm text-center">{loadingMsg}</p>
              {loadErrorDetail && assetBlock === "error" && (
                <p className="text-[10px] text-slate-600 font-mono break-all max-w-full opacity-80">{loadErrorDetail}</p>
              )}
              {assetBlock === "error" && (
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
                  <button
                    type="button"
                    onClick={retryVoiceLoad}
                    className="py-3 px-4 rounded-full border border-white/20 text-[10px] uppercase tracking-[0.2em] text-slate-200 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                  >
                    {language === "en" ? "Retry voice" : "Zkusit znovu"}
                  </button>
                  <button
                    type="button"
                    onClick={switchToVoiceless}
                    className="py-3 px-4 rounded-full bg-white/10 text-[10px] uppercase tracking-[0.2em] hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                  >
                    {language === "en" ? "Without voice" : "Bez hlasu"}
                  </button>
                </div>
              )}
            </div>
          )}
          {phase !== BreathingPhase.IDLE && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full">
              <p className="text-4xl font-serif text-white/95 tabular-nums tracking-widest" aria-live="polite">
                {formatTime(timeLeft)}
              </p>
              {cycle > 0 && (
                <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300/50 mt-3 font-semibold">
                  {language === "en" ? `Cycle ${cycle}` : `Cyklus ${cycle}`}
                </p>
              )}
            </div>
          )}
        </div>
        {showIdleControls && (
          <div
            className={`w-full max-w-sm space-y-8 md:space-y-14 transition-all duration-1000 transform ${assetsLoading && !assetBlock ? "opacity-40 scale-95 pointer-events-none" : "opacity-100 scale-100"}`}
          >
            <div className="flex justify-center flex-wrap gap-3" role="group" aria-label={language === "en" ? "Language" : "Jazyk"}>
              {(["en", "cs"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  aria-pressed={language === lang}
                  className={`px-8 py-2.5 text-[10px] uppercase tracking-[0.3em] rounded-full border transition-all duration-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 ${language === lang ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"}`}
                >
                  {lang === "en" ? "English" : "Čeština"}
                </button>
              ))}
            </div>
            <DurationSlider value={durationMins} onChange={setDurationMins} language={language} />
            <button
              type="button"
              onClick={() => void startSession()}
              disabled={!assetsReady}
              aria-disabled={!assetsReady}
              className="group relative w-full py-4 md:py-6 bg-white text-black rounded-full font-bold uppercase tracking-[0.3em] text-[11px] transition-all duration-500 hover:scale-[1.04] active:scale-95 disabled:opacity-25 disabled:pointer-events-none shadow-[0_25px_50px_-12px_rgba(255,255,255,0.15)] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-300"
            >
              <span className="relative z-10">{language === "en" ? "Begin journey" : "Začít cestu"}</span>
              <span className="sr-only">. {language === "en" ? "Starts guided breathing" : "Spustí vedené dýchání"}</span>
              <div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500" aria-hidden="true" />
            </button>
            {assetsReady && voiceMode === "silent" && (
              <button
                type="button"
                onClick={() => setVoiceMode("tts")}
                className="w-full py-3 text-[10px] uppercase tracking-[0.25em] text-slate-500 hover:text-slate-300 border border-white/5 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
              >
                {language === "en" ? "Use voice again" : "Znovu zapnout hlas"}
              </button>
            )}
          </div>
        )}
        {phase !== BreathingPhase.IDLE && (
          <button
            type="button"
            onClick={stopSession}
            className="px-12 py-4 border border-white/5 rounded-full text-slate-600 text-[11px] uppercase tracking-[0.4em] hover:bg-white/5 hover:text-slate-200 hover:border-white/20 transition-all duration-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          >
            {language === "en" ? "End practice" : "Ukončit"}
          </button>
        )}
      </div>
      <footer className="absolute bottom-4 md:bottom-12 text-center w-full px-6 opacity-30 pointer-events-none hidden sm:block">
        <p className="text-[10px] text-slate-700 uppercase tracking-[0.5em] max-w-sm mx-auto leading-relaxed italic">
          {language === "en"
            ? "Calm guidance for winding down before sleep"
            : "Klidné vedení před usínáním"}
        </p>
      </footer>
    </div>
  );
}
