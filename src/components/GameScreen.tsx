import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpinnerWheel from '@/components/SpinnerWheel';
import QuestionModal from '@/components/QuestionModal';
import OrbBackground from '@/components/OrbBackground';
import GameSidePanel from '@/components/GameSidePanel';
import { Question, MAX_SPINS, TOTAL_DIVISIONS } from '@/lib/questions';
import { fetchTeams, saveTeamData } from '@/lib/gameStore';
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
  const [skippedCount, setSkippedCount] = useState(initialState.skippedCount || 0);
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
  const [tabSwitches, setTabSwitches] = useState<Array<{ time: number }>>([]);
  const [tabWarning, setTabWarning] = useState(false);

  const stateRef = useRef<any>({});

  useEffect(() => {
    stateRef.current = {
      spinCount, score, answered, skippedCount, correctCount, wrongCount,
      usedDivisions: Array.from(usedDivisions), attemptLog, globalElapsed: elapsedRef.current,
      tabSwitches,
    };
  });

  // Tab switch detection - anti-cheat
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        const entry = { time: Date.now() };
        setTabSwitches(prev => {
          const updated = [...prev, entry];
          // Immediately sync to server
          syncTabSwitch(updated);
          return updated;
        });
        setTabWarning(true);
        playTabSwitchWarning();
        toast('⚠️ Tab switch detected! Admin has been notified.', 'err');
        setTimeout(() => setTabWarning(false), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const syncTabSwitch = useCallback(async (switches: Array<{ time: number }>) => {
    const teams = await fetchTeams();
    if (teams[teamName]) {
      teams[teamName].tabSwitches = switches;
      teams[teamName].tabSwitchCount = switches.length;
      await saveTeamData(teams);
    }
  }, [teamName]);

  const toast = (msg: string, type = '') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const syncTeam = useCallback(async (overrides?: any) => {
    const state = { ...stateRef.current, ...overrides };
    const teams = await fetchTeams();
    teams[teamName] = {
      ...teams[teamName],
      score: state.score, answered: state.answered, skippedCount: state.skippedCount,
      correctCount: state.correctCount, wrongCount: state.wrongCount, spinCount: state.spinCount,
      usedDivisions: state.usedDivisions, attemptLog: state.attemptLog, globalElapsed: state.globalElapsed,
      finished: state.spinCount >= MAX_SPINS || state.usedDivisions.length >= Math.min(TOTAL_DIVISIONS, questions.length),
      last: Date.now(),
    };
    await saveTeamData(teams);
  }, [teamName, questions.length]);

  useEffect(() => {
    globalTimerRef.current = setInterval(() => {
      elapsedRef.current++;
      setGlobalElapsed(elapsedRef.current);
      if (elapsedRef.current % 30 === 0) syncTeam();
    }, 1000);
    return () => { if (globalTimerRef.current) clearInterval(globalTimerRef.current); };
  }, [syncTeam]);

  const availableDivisions = Array.from({ length: Math.min(TOTAL_DIVISIONS, questions.length) }, (_, i) => i)
    .filter(i => !usedDivisions.has(i));

  const isGameOver = spinCount >= MAX_SPINS || availableDivisions.length === 0;

  useEffect(() => {
    if (isGameOver && !currentQuestion) {
      if (globalTimerRef.current) clearInterval(globalTimerRef.current);
      playGameCompleteSound();
      const finalState = { ...stateRef.current, globalElapsed: elapsedRef.current, finished: true, tabSwitches };
      syncTeam(finalState);
      setTimeout(() => onFinish(finalState), 500);
    }
  }, [isGameOver, currentQuestion]);

  const handleSpinComplete = (divIndex: number) => {
    if (divIndex < questions.length) {
      burst();
      setCurrentQuestion({ q: questions[divIndex], divIndex });
    }
  };

  const handleSubmit = async (correct: boolean) => {
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

  const handleSkip = async () => {
    const divIndex = currentQuestion!.divIndex;
    const newUsed = new Set(usedDivisions); newUsed.add(divIndex);
    const newLog = [...attemptLog, { qIndex: divIndex, action: 'skipped' }];
    const newSkipped = skippedCount + 1;
    const newSpinCount = spinCount + 1;

    setUsedDivisions(newUsed); setAttemptLog(newLog); setSkippedCount(newSkipped);
    setSpinCount(newSpinCount); setCurrentQuestion(null);
    toast('⏭ Skipped!', 'warn');

    if ((window as any).__spinnerTriggerRemove) (window as any).__spinnerTriggerRemove(divIndex);

    await syncTeam({
      skippedCount: newSkipped, spinCount: newSpinCount,
      usedDivisions: Array.from(newUsed), attemptLog: newLog, globalElapsed: elapsedRef.current,
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
          {tabSwitches.length > 0 && (
            <div className="topbar-pill" style={{ background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.3)', color: 'hsl(0 84% 65%)' }}>
              <span className="pill-icon">⚠️</span>
              <span>{tabSwitches.length} switch{tabSwitches.length > 1 ? 'es' : ''}</span>
            </div>
          )}
          <button onClick={onLogout} className="topbar-exit">✕ Exit</button>
        </div>

        {/* Main content */}
        <div className="game-main">
          {/* Left panel */}
          <GameSidePanel
            side="left"
            spinCount={spinCount}
            maxSpins={MAX_SPINS}
            availableCount={availableDivisions.length}
            totalDivisions={Math.min(TOTAL_DIVISIONS, questions.length)}
            globalElapsed={globalElapsed}
            attemptLog={attemptLog}
          />

          {/* Center - Spinner */}
          <div className="game-center">
            <SpinnerWheel
              divisions={availableDivisions}
              onSpinComplete={handleSpinComplete}
              disabled={!!currentQuestion || isGameOver}
              spinCount={spinCount}
              maxSpins={MAX_SPINS}
            />
          </div>

          {/* Right panel */}
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
            onSkip={handleSkip}
            open={!!currentQuestion}
          />
        )}
        {tabWarning && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'hsl(0 100% 10% / 0.85)', backdropFilter: 'blur(8px)',
            animation: 'mIn 0.2s ease-out',
          }}>
            <div style={{ textAlign: 'center', color: 'hsl(0 84% 65%)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '12px' }}>⚠️</div>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.5rem', fontWeight: 900, letterSpacing: '2px', marginBottom: '8px' }}>TAB SWITCH DETECTED</div>
              <div style={{ fontSize: '0.9rem', color: 'hsl(0 60% 75%)', fontWeight: 600 }}>This violation has been logged and reported to admin.</div>
              <div style={{ fontSize: '0.8rem', color: 'hsl(0 40% 60%)', marginTop: '6px' }}>Total violations: {tabSwitches.length}</div>
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
