import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpinnerWheel from '@/components/SpinnerWheel';
import QuestionModal from '@/components/QuestionModal';
import OrbBackground from '@/components/OrbBackground';
import GameSidePanel from '@/components/GameSidePanel';
import { Question, MAX_SPINS, TOTAL_DIVISIONS, GAME_TIME_LIMIT_SECONDS } from '@/lib/questions';
import { upsertTeamProgress } from '@/lib/gameStore';
import { playGameCompleteSound, playTabSwitchWarning } from '@/lib/sounds';

interface GameScreenProps {
  teamName: string;
  questions: Question[];
  initialState: any;
  onFinish: (state: any) => void;
  onLogout: () => void;
}

function burst() {
  const icons = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🎯', '🎰'];
  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = icons[Math.floor(Math.random() * icons.length)];
    p.style.left = (window.innerWidth / 2 - 20 + Math.random() * 40) + 'px';
    p.style.top = (window.innerHeight / 2 - 20 + Math.random() * 40) + 'px';
    const angle = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 150;
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 950);
  }
}

const GameScreen: React.FC<GameScreenProps> = ({ teamName, questions, initialState, onFinish, onLogout }) => {
  const [spinCount, setSpinCount] = useState(initialState.spinCount || 0);
  const [score, setScore] = useState(initialState.score || 0);
  const [answered, setAnswered] = useState(initialState.answered || 0);
  const [correctCount, setCorrectCount] = useState(initialState.correctCount || 0);
  const [wrongCount, setWrongCount] = useState(initialState.wrongCount || 0);
  const [usedDivisions, setUsedDivisions] = useState<Set<number>>(new Set(initialState.usedDivisions || []));
  const [attemptLog, setAttemptLog] = useState<Array<{ qIndex: number; action: string; correct?: boolean }>>(initialState.attemptLog || []);
  const [currentQuestion, setCurrentQuestion] = useState<{ q: Question; divIndex: number } | null>(null);
  const [globalElapsed, setGlobalElapsed] = useState(initialState.globalElapsed || 0);
  const globalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(initialState.globalElapsed || 0);
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const toastId = useRef(0);
  const [tabSwitches, setTabSwitches] = useState<Array<{ time: number }>>(initialState.tabSwitches || []);
  const [tabWarning, setTabWarning] = useState(false);
  // Track fullscreen request state (used to re-request if exited)
  const fsRequested = useRef(false);
  const finishTriggeredRef = useRef(false);

  const stateRef = useRef<any>({});
  useEffect(() => {
    stateRef.current = {
      spinCount, score, answered, correctCount, wrongCount,
      usedDivisions: Array.from(usedDivisions), attemptLog, globalElapsed: elapsedRef.current,
      tabSwitches,
    };
  });

  // ── Toast helper ────────────────────────────────────────────────────────────
  const toast = useCallback((msg: string, type = '') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  // ── Sync tab-switch count to Firestore ──────────────────────────────────────
  const syncTabSwitch = useCallback(async (switches: Array<{ time: number }>) => {
    try {
      await upsertTeamProgress(teamName, {
        tabSwitches: switches,
        tabSwitchCount: switches.length,
        last: Date.now(),
      });
    } catch (e) {
      console.error('syncTabSwitch error:', e);
    }
  }, [teamName]);

  // ── Anti-cheat: request fullscreen on game start ────────────────────────────
  useEffect(() => {
    const requestFs = async () => {
      try {
        if (document.fullscreenElement) return; // already fullscreen
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        fsRequested.current = true;
      } catch {
        // Browser may deny; that's okay — other guards still apply
      }
    };
    requestFs();

    // If user manually exits fullscreen, re-request it
    const onFsChange = async () => {
      if (!document.fullscreenElement && fsRequested.current) {
        toast('🔒 Fullscreen exited! Returning to fullscreen…', 'err');
        try {
          await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        } catch { /* ignore */ }
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      // Exit fullscreen when game ends / user logs out
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [toast]);

  // ── Anti-cheat: tab-switch detection ────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const entry = { time: Date.now() };
        setTabSwitches(prev => {
          const updated = [...prev, entry];
          syncTabSwitch(updated);
          return updated;
        });
        setTabWarning(true);
        playTabSwitchWarning();
        toast('⚠️ Tab switch detected! Admin has been notified.', 'err');
        setTimeout(() => setTabWarning(false), 3500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [syncTabSwitch, toast]);

  // ── Anti-cheat: block right-click, text-select, copy/screenshot keys ────────
  useEffect(() => {
    // Disable text selection via CSS
    const styleId = 'anti-cheat-style';
    if (!document.getElementById(styleId)) {
      const el = document.createElement('style');
      el.id = styleId;
      el.textContent =
        'body{-webkit-user-select:none!important;user-select:none!important;pointer-events:auto;}' +
        'input,textarea{-webkit-user-select:text!important;user-select:text!important;}';
      document.head.appendChild(el);
    }

    const blockCtxMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast('🚫 Right-click is disabled during the game.', 'err');
    };

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Block Ctrl/Cmd + C (copy), A (select-all), S (save), P (print), U (view-source)
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 's', 'p', 'u'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        toast('🚫 This action is blocked during the game.', 'err');
        return;
      }
      // Block PrintScreen / Snapshot keys
      if (['printscreen', 'print', 'snapshot'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        toast('🚫 Screenshots are disabled during the game.', 'err');
        return;
      }
      // Block F12 DevTools
      if (key === 'f12') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', blockCtxMenu);
    document.addEventListener('keydown', blockKeys, true);

    return () => {
      document.removeEventListener('contextmenu', blockCtxMenu);
      document.removeEventListener('keydown', blockKeys, true);
      document.getElementById(styleId)?.remove();
    };
  }, [toast]);

  // ── General team sync ────────────────────────────────────────────────────────
  const syncTeam = useCallback(async (overrides?: any) => {
    const state = { ...stateRef.current, ...overrides };
    await upsertTeamProgress(teamName, {
      score: state.score,
      answered: state.answered,
      correctCount: state.correctCount,
      wrongCount: state.wrongCount,
      spinCount: state.spinCount,
      usedDivisions: state.usedDivisions,
      attemptLog: state.attemptLog,
      globalElapsed: state.globalElapsed,
      // Preserve anti-cheat data through regular syncs
      tabSwitches: state.tabSwitches,
      tabSwitchCount: (state.tabSwitches || []).length,
      finished: state.spinCount >= MAX_SPINS || state.usedDivisions.length >= Math.min(TOTAL_DIVISIONS, questions.length) || state.globalElapsed >= GAME_TIME_LIMIT_SECONDS,
      last: Date.now(),
      skippedCount: 0,
    });
  }, [teamName, questions.length]);

  // Global timer + periodic sync
  useEffect(() => {
    globalTimerRef.current = setInterval(() => {
      if (finishTriggeredRef.current) return;
      elapsedRef.current++;
      if (elapsedRef.current >= GAME_TIME_LIMIT_SECONDS) {
        elapsedRef.current = GAME_TIME_LIMIT_SECONDS;
        setGlobalElapsed(elapsedRef.current);
        setCurrentQuestion(null);
        toast('⏰ Time is up! Game closed after 15 minutes.', 'warn');
        if (globalTimerRef.current) clearInterval(globalTimerRef.current);
        syncTeam({ globalElapsed: elapsedRef.current, finished: true });
        return;
      }
      setGlobalElapsed(elapsedRef.current);
      if (elapsedRef.current % 30 === 0) syncTeam();
    }, 1000);
    return () => { if (globalTimerRef.current) clearInterval(globalTimerRef.current); };
  }, [syncTeam, toast]);

  const availableDivisions = Array.from({ length: Math.min(TOTAL_DIVISIONS, questions.length) }, (_, i) => i)
    .filter(i => !usedDivisions.has(i));

  const isGameOver = spinCount >= MAX_SPINS || availableDivisions.length === 0 || globalElapsed >= GAME_TIME_LIMIT_SECONDS;

  useEffect(() => {
    if (isGameOver && !finishTriggeredRef.current) {
      finishTriggeredRef.current = true;
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      setCurrentQuestion(null);
      playGameCompleteSound();
      const finalState = {
        ...stateRef.current,
        globalElapsed: Math.min(elapsedRef.current, GAME_TIME_LIMIT_SECONDS),
        finished: true,
        tabSwitches,
        tabSwitchCount: tabSwitches.length,
      };
      syncTeam(finalState);
      setTimeout(() => onFinish(finalState), 500);
    }
  }, [isGameOver, onFinish, syncTeam, tabSwitches]);

  const handleSpinComplete = (divIndex: number) => {
    if (divIndex < questions.length) {
      burst();
      setCurrentQuestion({ q: questions[divIndex], divIndex });
    }
  };

  const handleSubmit = async (correct: boolean) => {
    if (finishTriggeredRef.current) return;
    const divIndex = currentQuestion!.divIndex;
    const pts = { easy: 10, medium: 15, hard: 20 }[currentQuestion!.q.diff] || 10;
    const newUsed = new Set(usedDivisions); newUsed.add(divIndex);
    const newLog = [...attemptLog, { qIndex: divIndex, action: 'answered', correct }];
    const newScore = correct ? score + pts : score;
    const newAnswered = answered + 1;
    const newCorrect = correct ? correctCount + 1 : correctCount;
    const newWrong = correct ? wrongCount : wrongCount + 1;
    const newSpinCount = spinCount + 1;

    setUsedDivisions(newUsed); setAttemptLog(newLog); setScore(newScore);
    setAnswered(newAnswered); setCorrectCount(newCorrect); setWrongCount(newWrong);
    setSpinCount(newSpinCount); setCurrentQuestion(null);

    if (correct) { burst(); toast('✨ Correct!', 'ok'); }
    else { toast('📝 Submitted!', ''); }

    if ((window as any).__spinnerTriggerRemove) (window as any).__spinnerTriggerRemove(divIndex);

    await syncTeam({
      score: newScore, answered: newAnswered, correctCount: newCorrect, wrongCount: newWrong,
      spinCount: newSpinCount, usedDivisions: Array.from(newUsed), attemptLog: newLog,
      globalElapsed: elapsedRef.current,
    });
  };

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="game-root">
        <OrbBackground />
        {/* Floating stars */}
        <div className="stellar-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="stellar-star" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              fontSize: `${0.5 + Math.random() * 0.8}rem`,
            }}>✦</div>
          ))}
        </div>

        {/* Top bar */}
        <div className="game-topbar">
          <div className="game-topbar-brand">
            <span className="brand-icon">🎡</span>
            <div>
              <div className="brand-name">SPINIGMA</div>
              <div className="brand-sub">TECNOPHILIA 3.0</div>
            </div>
          </div>
          <div className="game-topbar-team">{teamName}</div>
          <div style={{ flex: 1 }} />
          <div className="topbar-pill topbar-pill-time">
            <span className="pill-icon">⏱</span>
            <span>{fmtTime(globalElapsed)}</span>
          </div>
          <div className="topbar-pill topbar-pill-spin">
            <span className="pill-icon">🎰</span>
            <span>{spinCount}/{MAX_SPINS}</span>
          </div>
          {/* Live tab-switch counter shown in top bar */}
          {tabSwitches.length > 0 && (
            <div className="topbar-pill" style={{
              background: 'hsl(0 84% 60% / 0.15)',
              border: '1px solid hsl(0 84% 60% / 0.4)',
              color: 'hsl(0 84% 65%)',
            }}>
              <span className="pill-icon">⚠️</span>
              <span>Switch: {tabSwitches.length}</span>
            </div>
          )}
          <button onClick={onLogout} className="topbar-exit">✕ Exit</button>
        </div>

        {/* Main content */}
        <div className="game-main">
          <GameSidePanel
            side="left"
            spinCount={spinCount}
            maxSpins={MAX_SPINS}
            availableCount={availableDivisions.length}
            totalDivisions={Math.min(TOTAL_DIVISIONS, questions.length)}
            globalElapsed={globalElapsed}
            attemptLog={attemptLog}
          />

          <div className="game-center">
            <SpinnerWheel
              divisions={availableDivisions}
              onSpinComplete={handleSpinComplete}
              disabled={!!currentQuestion || isGameOver}
              spinCount={spinCount}
              maxSpins={MAX_SPINS}
            />
          </div>

          <GameSidePanel
            side="right"
            spinCount={spinCount}
            maxSpins={MAX_SPINS}
            availableCount={availableDivisions.length}
            totalDivisions={Math.min(TOTAL_DIVISIONS, questions.length)}
            globalElapsed={globalElapsed}
            attemptLog={attemptLog}
          />
        </div>

        {currentQuestion && (
          <QuestionModal
            question={currentQuestion.q}
            divisionIndex={currentQuestion.divIndex}
            onSubmit={handleSubmit}
            open={!!currentQuestion}
          />
        )}

        {/* Tab-switch overlay warning */}
        {tabWarning && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'hsl(0 100% 8% / 0.92)', backdropFilter: 'blur(10px)',
            animation: 'mIn 0.2s ease-out',
          }}>
            <div style={{ textAlign: 'center', color: 'hsl(0 84% 65%)' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '12px' }}>🚨</div>
              <div style={{
                fontFamily: "'Nunito',sans-serif", fontSize: '1.8rem', fontWeight: 900,
                letterSpacing: '3px', marginBottom: '10px', textTransform: 'uppercase',
              }}>Tab Switch Detected!</div>
              <div style={{ fontSize: '0.95rem', color: 'hsl(0 60% 75%)', fontWeight: 600, marginBottom: '6px' }}>
                This violation has been logged and reported to admin.
              </div>
              <div style={{
                display: 'inline-block',
                background: 'hsl(0 84% 60% / 0.2)', border: '1px solid hsl(0 84% 60% / 0.4)',
                color: 'hsl(0 84% 70%)', padding: '6px 18px', borderRadius: '50px',
                fontSize: '0.88rem', fontWeight: 800, letterSpacing: '1px',
              }}>
                Total Violations: {tabSwitches.length}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className={'toast-item ' + t.type}>{t.msg}</div>
        ))}
      </div>
    </>
  );
};

export default GameScreen;
