import React, { useState } from 'react';
import OrbBackground from '@/components/OrbBackground';
import { playEntrySound } from '@/lib/sounds';

interface LoginScreenProps {
  onTeamLogin: (name: string, lead: string) => void;
  onAdminLogin: (pass: string) => void;
}

const TEAM_PASSKEY = 'AMIGINPS';

const LoginScreen: React.FC<LoginScreenProps> = ({ onTeamLogin, onAdminLogin }) => {
  const [tab, setTab] = useState<'team' | 'admin'>('team');
  const [teamId, setTeamId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [leadName, setLeadName] = useState('');
  const [passkey, setPasskey] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [shake, setShake] = useState(false);
  const [passkeyError, setPasskeyError] = useState(false);

  const handleTeamSubmit = () => {
    if (passkey.toUpperCase() !== TEAM_PASSKEY) {
      setPasskeyError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setPasskeyError(false);
    playEntrySound();
    onTeamLogin(teamName, leadName);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      background: 'hsl(250 100% 4%)',
    }}>
      <OrbBackground />
      <div className="mesh-grid" />


      {/* Shooting stars - reduced */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={`star-${i}`} className="login-shooting-star" style={{
          '--top': `${15 + i * 35}%`,
          '--delay': `${i * 3}s`,
          '--dur': `${4 + i}s`,
        } as React.CSSProperties} />
      ))}

      {/* Floating emoji decorations - reduced */}
      {['🌟', '✨', '🎯'].map((emoji, i) => (
        <span key={`emoji-${i}`} className="login-float-emoji" style={{
          left: `${15 + i * 30}%`,
          top: `${20 + (i % 2) * 40}%`,
          fontSize: '1.5rem',
          animationDuration: `${5 + i}s`,
          animationDelay: `${i}s`,
        }}>{emoji}</span>
      ))}

      {/* Floating particles - reduced for performance */}
      <div className="login-particles">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="login-particle" style={{
            left: `${10 + i * 9}%`,
            top: `${5 + (i * 37) % 90}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${4 + i * 0.5}s`,
            fontSize: `${0.5 + (i % 3) * 0.2}rem`,
          }}>✦</span>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '440px', padding: '20px' }}>
        {/* Glow ring */}
        

        {/* Header with staggered animations */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div className="login-badge-anim" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, hsl(270 95% 65%), hsl(330 85% 60%))',
            color: 'white', fontFamily: "'Nunito',sans-serif", fontSize: '0.7rem',
            fontWeight: 900, letterSpacing: '4px', padding: '5px 18px',
            borderRadius: '50px', marginBottom: '12px',
            boxShadow: '0 4px 20px hsl(270 95% 65% / 0.4)',
          }}>TECNOPHILIA 3.0</div>
          <div className="login-icon-anim" style={{
            fontSize: '4rem', animation: 'ratBob 2s ease-in-out infinite',
            display: 'inline-block', filter: 'drop-shadow(0 8px 25px hsl(270 95% 65% / 0.5))',
          }}>🎡</div>
          <h1 className="gradient-text-animated login-title-anim login-title-glow" style={{
            fontFamily: "'Nunito',sans-serif", fontSize: '2.8rem', fontWeight: 900,
            letterSpacing: '5px', lineHeight: 1, marginTop: '4px',
          }}>SPINIGMA</h1>
          <div className="gradient-text login-subtitle-anim" style={{
            fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem', fontWeight: 800,
            letterSpacing: '4px', marginTop: '4px',
          }}>QUIZ SPINNER</div>
          <p className="login-tagline-anim" style={{ color: 'hsl(250 15% 50%)', fontSize: '0.82rem', marginTop: '6px', fontWeight: 600, letterSpacing: '2px' }}>
            Spin · Answer · Win
          </p>
        </div>

        <div className={`glass-card login-card-anim ${shake ? 'shake-anim' : ''}`}>
          <div style={{
            display: 'flex', marginBottom: '20px', background: 'hsl(250 20% 14%)',
            borderRadius: '12px', padding: '4px', gap: '4px',
          }}>
            <button onClick={() => setTab('team')} style={{
              flex: 1, padding: '9px', background: tab === 'team' ? 'hsl(250 30% 18%)' : 'transparent',
              border: tab === 'team' ? '1px solid hsl(270 95% 65% / 0.3)' : '1px solid transparent',
              color: tab === 'team' ? 'hsl(270 95% 75%)' : 'hsl(250 15% 45%)',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '1px', cursor: 'pointer', borderRadius: '9px',
              textTransform: 'uppercase',
              boxShadow: tab === 'team' ? '0 2px 15px hsl(270 95% 65% / 0.15)' : 'none',
              transition: 'all 0.25s',
            }}>🏆 Team</button>
            <button onClick={() => setTab('admin')} style={{
              flex: 1, padding: '9px', background: tab === 'admin' ? 'hsl(250 30% 18%)' : 'transparent',
              border: tab === 'admin' ? '1px solid hsl(270 95% 65% / 0.3)' : '1px solid transparent',
              color: tab === 'admin' ? 'hsl(270 95% 75%)' : 'hsl(250 15% 45%)',
              fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.78rem', fontWeight: 700,
              letterSpacing: '1px', cursor: 'pointer', borderRadius: '9px',
              textTransform: 'uppercase',
              boxShadow: tab === 'admin' ? '0 2px 15px hsl(270 95% 65% / 0.15)' : 'none',
              transition: 'all 0.25s',
            }}>🔑 Admin</button>
          </div>

          {tab === 'team' ? (
            <>
              <div className="field-anim" style={{ marginBottom: '14px', animationDelay: '0.05s' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', color: 'hsl(270 95% 75%)', marginBottom: '6px', textTransform: 'uppercase' }}>🔐 Passkey</label>
                <input type="password" value={passkey} onChange={e => { setPasskey(e.target.value); setPasskeyError(false); }}
                  placeholder="Enter event passkey…" autoComplete="off"
                  style={{
                    width: '100%', background: 'hsl(250 20% 14%)',
                    border: `1.5px solid ${passkeyError ? 'hsl(0 84% 60% / 0.6)' : 'hsl(250 30% 20%)'}`,
                    borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: '0.92rem', fontWeight: 600, padding: '11px 15px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
                  onBlur={e => e.target.style.borderColor = passkeyError ? 'hsl(0 84% 60% / 0.6)' : 'hsl(250 30% 20%)'}
                />
                {passkeyError && (
                  <p style={{ fontSize: '0.7rem', color: 'hsl(0 84% 60%)', marginTop: '4px', fontWeight: 600 }}>
                    ✕ Invalid passkey. Try again.
                  </p>
                )}
              </div>
              <div className="field-anim" style={{ marginBottom: '14px', animationDelay: '0.1s' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', color: 'hsl(270 95% 75%)', marginBottom: '6px', textTransform: 'uppercase' }}>Team ID</label>
                <input type="text" value={teamId} onChange={e => setTeamId(e.target.value)}
                  placeholder="Enter your team ID…" autoComplete="off"
                  style={{
                    width: '100%', background: 'hsl(250 20% 14%)', border: '1.5px solid hsl(250 30% 20%)',
                    borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: '0.92rem', fontWeight: 600, padding: '11px 15px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(250 30% 20%)'}
                />
              </div>
              <div className="field-anim" style={{ marginBottom: '14px', animationDelay: '0.15s' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', color: 'hsl(270 95% 75%)', marginBottom: '6px', textTransform: 'uppercase' }}>Team Name</label>
                <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
                  placeholder="Enter your team name…" autoComplete="off"
                  style={{
                    width: '100%', background: 'hsl(250 20% 14%)', border: '1.5px solid hsl(250 30% 20%)',
                    borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: '0.92rem', fontWeight: 600, padding: '11px 15px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(250 30% 20%)'}
                />
              </div>
              <div className="field-anim" style={{ marginBottom: '14px', animationDelay: '0.2s' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', color: 'hsl(270 95% 75%)', marginBottom: '6px', textTransform: 'uppercase' }}>Team Lead Name</label>
                <input type="text" value={leadName} onChange={e => setLeadName(e.target.value)}
                  placeholder="Team leader's name…" autoComplete="off"
                  style={{
                    width: '100%', background: 'hsl(250 20% 14%)', border: '1.5px solid hsl(250 30% 20%)',
                    borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: '0.92rem', fontWeight: 600, padding: '11px 15px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(250 30% 20%)'}
                />
              </div>
              <p className="field-anim" style={{ fontSize: '0.76rem', color: 'hsl(250 15% 50%)', marginBottom: '14px', lineHeight: 1.5, animationDelay: '0.25s' }}>
                ✦ Enter the event passkey to unlock the arena.
              </p>
              <button onClick={handleTeamSubmit} className="glow-btn field-anim" style={{
                width: '100%', padding: '13px', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase',
                animationDelay: '0.3s',
              }}>🎡 Enter the Arena</button>
            </>
          ) : (
            <>
              <div className="field-anim" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', color: 'hsl(270 95% 75%)', marginBottom: '6px', textTransform: 'uppercase' }}>Admin Passphrase</label>
                <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                  placeholder="Enter admin key…"
                  onKeyDown={e => e.key === 'Enter' && onAdminLogin(adminPass)}
                  style={{
                    width: '100%', background: 'hsl(250 20% 14%)', border: '1.5px solid hsl(250 30% 20%)',
                    borderRadius: '11px', color: 'hsl(0 0% 92%)', fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: '0.92rem', fontWeight: 600, padding: '11px 15px', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'hsl(270 95% 65% / 0.5)'}
                  onBlur={e => e.target.style.borderColor = 'hsl(250 30% 20%)'}
                />
              </div>
              <button onClick={() => onAdminLogin(adminPass)} className="glow-btn field-anim" style={{
                width: '100%', padding: '13px', fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase',
                animationDelay: '0.1s',
              }}>🔑 Access Control Panel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
