import React, { useState, useEffect, useRef } from 'react';
import { Question, Q_TIMERS, norm } from '@/lib/questions';
import { playCorrectSound, playWrongSound } from '@/lib/sounds';

interface QuestionModalProps {
  question: Question;
  divisionIndex: number;
  onSubmit: (correct: boolean) => void;
  open: boolean;
}

const RING_CIRC = 201;

const QuestionModal: React.FC<QuestionModalProps> = ({ question, divisionIndex, onSubmit, open }) => {
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [textInput, setTextInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);
  const textRef = useRef<HTMLInputElement>(null);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
  };

  const finalize = (correct: boolean, message: string, delayMs: number) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    clearTimers();
    setFeedback(message);
    if (correct) playCorrectSound();
    else playWrongSound();
    setTimeout(() => onSubmit(correct), delayMs);
  };

  useEffect(() => {
    if (open) {
      submittingRef.current = false;
      setSelectedOpt(null); setTextInput(''); setSubmitting(false); setFeedback('');
      const dur = Q_TIMERS[question.diff] || 30;
      setTimeLeft(dur); setTotalTime(dur);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);

      autoSubmitRef.current = setTimeout(() => {
        finalize(false, '⏰ Time up! Marked wrong.', 900);
      }, dur * 1000);

      if (question.type === 'tite') setTimeout(() => textRef.current?.focus(), 200);
    }
    return () => {
      clearTimers();
    };
  }, [open, question]);

  const handleSubmit = () => {
    if (submittingRef.current) return;
    let correct = false;
    if (!question.type || question.type === 'mcq') {
      if (selectedOpt === null) return;
      correct = selectedOpt === question.ans;
    } else {
      if (!textInput.trim()) return;
      correct = norm(textInput.trim()) === norm(String(question.ans));
    }
    if (correct) {
      finalize(true, '✅ Correct! Well done!', 1100);
      return;
    }
    finalize(false, '❌ Wrong answer!', 1100);
  };

  if (!open) return null;

  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = RING_CIRC * (1 - pct);
  const pts = { easy: 10, medium: 15, hard: 20 }[question.diff] || 10;
  const timerWarn = pct <= 0.2 ? 'danger' : pct <= 0.4 ? 'warn' : '';

  const diffColors: Record<string, { bg: string; fg: string }> = {
    easy: { bg: 'hsl(155 80% 45% / 0.15)', fg: 'hsl(155 80% 50%)' },
    medium: { bg: 'hsl(40 95% 60% / 0.15)', fg: 'hsl(40 95% 60%)' },
    hard: { bg: 'hsl(0 84% 60% / 0.15)', fg: 'hsl(0 84% 60%)' },
  };
  const dc = diffColors[question.diff] || diffColors.easy;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'hsl(250 100% 4% / 0.7)',
      backdropFilter: 'blur(12px)', zIndex: 200, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'hsl(250 30% 10%)', borderRadius: '22px', width: '100%', maxWidth: '580px',
        maxHeight: '94vh', overflowY: 'auto', padding: '28px',
        boxShadow: '0 20px 70px hsl(270 95% 65% / 0.2), 0 0 0 1px hsl(250 30% 18%)',
        animation: 'mIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        border: '1px solid hsl(250 30% 18%)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '16px', paddingBottom: '13px', borderBottom: '1px solid hsl(250 30% 18%)',
        }}>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            <span style={{ padding: '3px 12px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', background: dc.bg, color: dc.fg }}>{question.diff.toUpperCase()}</span>
            <span style={{ padding: '3px 12px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', background: 'hsl(270 95% 65% / 0.12)', color: 'hsl(270 95% 75%)' }}>{question.type === 'tite' ? 'TITE' : 'MCQ'}</span>
            <span style={{ padding: '3px 12px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', background: 'hsl(185 90% 50% / 0.12)', color: 'hsl(185 90% 55%)' }}>DIV {divisionIndex + 1}</span>
          </div>
          <div className="gradient-text" style={{ fontFamily: "'Nunito', sans-serif", fontSize: '1.3rem', fontWeight: 900 }}>+{pts} pts</div>
        </div>

        {/* Timer ring */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <svg width="60" height="60" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="hsl(250, 30%, 18%)" strokeWidth="6" />
              <circle cx="36" cy="36" r="32" fill="none"
                stroke={timerWarn === 'danger' ? '#ef4444' : timerWarn === 'warn' ? '#f97316' : '#a855f7'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={RING_CIRC} strokeDashoffset={dashOffset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '36px 36px', transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              fontFamily: "'Nunito', sans-serif", fontSize: '1.1rem', fontWeight: 900,
              color: timerWarn === 'danger' ? '#ef4444' : timerWarn === 'warn' ? '#f97316' : 'hsl(0 0% 92%)',
              animation: timerWarn === 'danger' ? 'npulse 0.5s infinite' : 'none',
            }}>{timeLeft}</div>
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize: '0.98rem', lineHeight: 1.7, color: 'hsl(0 0% 90%)', marginBottom: '13px', fontWeight: 500 }}>{question.text}</div>

        {question.code && (
          <div style={{
            background: 'hsl(250 20% 7%)', border: '1px solid hsl(250 30% 18%)',
            borderLeft: '4px solid hsl(270 95% 65%)', borderRadius: '11px',
            padding: '12px 16px', fontFamily: "'Fira Code', monospace",
            fontSize: '0.8rem', color: 'hsl(270 95% 80%)', marginBottom: '15px',
            overflowX: 'auto', whiteSpace: 'pre', lineHeight: 1.7,
          }}>{question.code}</div>
        )}

        {feedback && (
          <div style={{
            padding: '11px 15px', borderRadius: '13px', marginBottom: '13px',
            fontWeight: 700, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '9px',
            background: 'hsl(270 95% 65% / 0.1)', border: '1px solid hsl(270 95% 65% / 0.2)', color: 'hsl(270 95% 80%)',
          }}>{feedback}</div>
        )}

        {/* Options */}
        {(!question.type || question.type === 'mcq') && question.opts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
            {question.opts.map((opt, i) => (
              <button key={i} onClick={() => !submitting && setSelectedOpt(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: '12px 14px',
                  background: selectedOpt === i ? 'hsl(270 95% 65% / 0.12)' : 'hsl(250 20% 14%)',
                  border: `1.5px solid ${selectedOpt === i ? 'hsl(270 95% 65% / 0.4)' : 'hsl(250 30% 18%)'}`,
                  borderRadius: '13px', color: selectedOpt === i ? 'hsl(270 95% 80%)' : 'hsl(0 0% 85%)',
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem',
                  fontWeight: selectedOpt === i ? 700 : 500, cursor: submitting ? 'not-allowed' : 'pointer',
                  textAlign: 'left', width: '100%', transition: 'all 0.2s',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <span style={{
                  width: '26px', height: '26px', background: selectedOpt === i ? 'hsl(270 95% 65% / 0.2)' : 'hsl(250 30% 18%)',
                  border: `1.5px solid ${selectedOpt === i ? 'hsl(270 95% 65% / 0.4)' : 'hsl(250 30% 22%)'}`,
                  borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Fira Code', monospace", fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  color: selectedOpt === i ? 'hsl(270 95% 80%)' : 'hsl(250 15% 50%)',
                }}>{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text input */}
        {question.type === 'tite' && (
          <div style={{ marginBottom: '14px' }}>
            <input ref={textRef} type="text" value={textInput}
              onChange={(e) => !submitting && setTextInput(e.target.value)}
              placeholder="Type your answer here…"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%', background: 'hsl(250 20% 14%)', border: '1.5px solid hsl(250 30% 18%)',
                borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Fira Code', monospace",
                fontSize: '0.92rem', padding: '12px 15px', outline: 'none', fontWeight: 500,
                opacity: submitting ? 0.6 : 1, transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
              onBlur={e => e.target.style.borderColor = 'hsl(250 30% 18%)'}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleSubmit}
            disabled={submitting || ((!question.type || question.type === 'mcq') ? selectedOpt === null : !textInput.trim())}
            className="glow-btn"
            style={{
              padding: '11px 18px', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', flex: 1,
              opacity: submitting || ((!question.type || question.type === 'mcq') ? selectedOpt === null : !textInput.trim()) ? 0.4 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >⚔ Submit</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionModal;
