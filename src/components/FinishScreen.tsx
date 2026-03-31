import React, { useEffect } from 'react';
import OrbBackground from '@/components/OrbBackground';
import { playGameCompleteSound } from '@/lib/sounds';

interface FinishScreenProps {
  teamName: string;
  state: any;
  onLogout: () => void;
}

const FinishScreen: React.FC<FinishScreenProps> = ({ teamName, state, onLogout }) => {
  useEffect(() => {
    playGameCompleteSound();
  }, []);

  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      background: 'hsl(250 100% 4%)',
    }}>
      <OrbBackground />
      <div className="mesh-grid" />
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '22px', position: 'relative', zIndex: 2 }}>
        <span style={{
          fontSize: '5rem', animation: 'fdance 0.4s ease-in-out infinite alternate',
          display: 'block', filter: 'drop-shadow(0 8px 25px hsl(270 95% 65% / 0.5))',
        }}>🎡</span>
        <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.75rem', fontWeight: 900, letterSpacing: '4px', marginBottom: '3px' }}>
          <span className="gradient-text">TECNOPHILIA 3.0</span>
        </div>
        <div className="gradient-text-animated" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '2.8rem', fontWeight: 900, letterSpacing: '3px', margin: '14px 0 7px' }}>
          GAME OVER!
        </div>
        <div style={{
          fontFamily: "'Nunito',sans-serif", fontSize: '5rem', fontWeight: 900, lineHeight: 1, marginBottom: '5px',
          background: 'linear-gradient(135deg, hsl(155 80% 45%), hsl(185 90% 50%))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 4px 18px hsl(155 80% 45% / 0.3))',
        }}>
          {state.score || 0}
        </div>
        <div style={{ color: 'hsl(250 15% 55%)', fontSize: '0.9rem', marginBottom: '22px', fontWeight: 600 }}>
          Team <strong style={{ color: 'hsl(0 0% 92%)' }}>{teamName}</strong> finished! 🎉
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { val: state.spinCount || 0, label: 'Spins', color: 'hsl(270 95% 65%)' },
            { val: state.answered || 0, label: 'Answered', color: 'hsl(155 80% 45%)' },
            { val: state.correctCount || 0, label: 'Correct', color: 'hsl(185 90% 50%)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'hsl(250 30% 10% / 0.8)', borderRadius: '16px', padding: '15px',
              boxShadow: '0 4px 20px hsl(270 95% 65% / 0.12)',
              border: '1px solid hsl(250 30% 18%)',
            }}>
              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.9rem', fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1.5px', color: 'hsl(250 15% 50%)', textTransform: 'uppercase', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{
          background: 'hsl(250 30% 10% / 0.8)', borderRadius: '16px', padding: '14px',
          border: '1px solid hsl(250 30% 18%)',
          boxShadow: '0 4px 20px hsl(270 95% 65% / 0.12)', display: 'inline-block', minWidth: '180px', marginBottom: '18px',
        }}>
          <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.5rem', fontWeight: 900 }}>{fmtTime(state.globalElapsed || 0)}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1.5px', color: 'hsl(250 15% 50%)', textTransform: 'uppercase', marginTop: '3px' }}>Time Taken</div>
        </div>
        <br />
        <button onClick={onLogout} className="glow-btn" style={{
          padding: '13px 44px', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '8px',
        }}>🏠 Back to Lobby</button>
      </div>
    </div>
  );
};

export default FinishScreen;
