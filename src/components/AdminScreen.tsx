import React, { useState, useEffect, useCallback } from 'react';
import { fetchTeams, saveTeamData, fetchQuestions, getQCache, saveQuestions, getSettings, saveSettings_ } from '@/lib/gameStore';
import { Question, MAX_SPINS } from '@/lib/questions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdminScreenProps {
  onLogout: () => void;
}

const fmtTime = (secs: number) => {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Reusable dark theme colors
const C = {
  bg: 'hsl(250 100% 4%)',
  card: 'hsl(250 30% 10%)',
  cardBorder: 'hsl(250 30% 18%)',
  input: 'hsl(250 20% 14%)',
  inputBorder: 'hsl(250 30% 20%)',
  label: 'hsl(270 95% 75%)',
  text: 'hsl(0 0% 90%)',
  muted: 'hsl(250 15% 50%)',
  primary: 'hsl(270 95% 65%)',
  accent: 'hsl(185 90% 50%)',
  green: 'hsl(155 80% 50%)',
  red: 'hsl(0 84% 60%)',
  orange: 'hsl(25 95% 60%)',
  pink: 'hsl(330 85% 60%)',
};

const AdminScreen: React.FC<AdminScreenProps> = ({ onLogout }) => {
  const [activeNav, setActiveNav] = useState('Leaderboard');
  const [teams, setTeams] = useState<Record<string, any>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'err'>('checking');
  const [editQ, setEditQ] = useState<{ idx: number; q: Partial<Question> } | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const toastId = React.useRef(0);

  const toast = (msg: string, type = '') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const refresh = useCallback(async () => {
    const t = await fetchTeams();
    setTeams({ ...t });
    const q = await fetchQuestions();
    setQuestions([...q]);
  }, []);

  useEffect(() => {
    refresh();
    checkDb();
    const interval = setInterval(() => {
      if (activeNav === 'Leaderboard') refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeNav, refresh]);

  const checkDb = async () => {
    setDbStatus('checking');
    try {
      const t = await fetchTeams();
      setDbStatus(t !== null ? 'ok' : 'err');
    } catch {
      setDbStatus('err');
    }
  };

  const getElapsed = (t: any) => (typeof t.globalElapsed === 'number' ? t.globalElapsed : Number.MAX_SAFE_INTEGER);

  const teamList = Object.values(teams).sort((a: any, b: any) => {
    if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
    const timeDiff = getElapsed(a) - getElapsed(b);
    if (timeDiff !== 0) return timeDiff;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  const leaderboardRows = teamList.map((t: any) => ({
    teamId: t.name || '—',
    lead: t.lead || '—',
    score: t.score || 0,
    correct: t.correctCount || 0,
    wrong: t.wrongCount || 0,
    time: getElapsed(t) === Number.MAX_SAFE_INTEGER ? '—' : fmtTime(getElapsed(t)),
    switches: t.tabSwitchCount || 0,
    status: t.finished ? 'Done' : `${t.spinCount || 0}/${MAX_SPINS}`,
  }));

  const topScore = teamList[0]?.score || 0;
  const avgScore = teamList.length ? Math.round(teamList.reduce((s: number, t: any) => s + (t.score || 0), 0) / teamList.length) : 0;
  const doneCount = teamList.filter((t: any) => t.finished).length;

  const exportLeaderboardCsv = () => {
    if (leaderboardRows.length === 0) {
      toast('No leaderboard data to export.', 'warn');
      return;
    }

    const headers = ['Team-ID', 'Lead', 'Score', 'Correct', 'Wrong', 'Time', 'Switch', 'Status'];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      headers.join(','),
      ...leaderboardRows.map(r => [
        esc(r.teamId),
        esc(r.lead),
        esc(r.score),
        esc(r.correct),
        esc(r.wrong),
        esc(r.time),
        esc(r.switches),
        esc(r.status),
      ].join(',')),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Leaderboard exported as CSV.', 'ok');
  };

  const exportLeaderboardPdf = () => {
    if (leaderboardRows.length === 0) {
      toast('No leaderboard data to export.', 'warn');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('SPINIGMA Leaderboard', 40, 36);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 54);

    autoTable(doc, {
      startY: 70,
      head: [['Team-ID', 'Lead', 'Score', 'Correct', 'Wrong', 'Time', 'Switch', 'Status']],
      body: leaderboardRows.map(r => [
        r.teamId,
        r.lead,
        String(r.score),
        String(r.correct),
        String(r.wrong),
        r.time,
        String(r.switches),
        r.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [88, 40, 140] },
    });

    doc.save(`leaderboard-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.pdf`);
    toast('Leaderboard exported as PDF.', 'ok');
  };

  const deleteTeam = async (name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    const { db } = await import('@/lib/firebase');
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'teams', name));
    refresh();
    toast(`"${name}" removed.`, 'warn');
  };

  const handleDeleteQ = async (idx: number) => {
    if (!confirm('Delete?')) return;
    const qs = getQCache().slice();
    qs.splice(idx, 1);
    await saveQuestions(qs);
    setQuestions([...qs]);
    toast('Deleted.', 'warn');
  };

  const handleSaveQ = async () => {
    if (!editQ) return;
    const q = editQ.q as Question;
    if (!q.text) { toast('Question text required!', 'err'); return; }
    if (q.type === 'mcq' && (!q.opts || q.opts.some(o => !o))) { toast('Fill all options!', 'err'); return; }
    if (q.type === 'tite' && !q.ans) { toast('Provide answer!', 'err'); return; }

    const qs = getQCache().slice();
    if (editQ.idx === -1) qs.push(q as Question);
    else qs[editQ.idx] = q as Question;
    await saveQuestions(qs);
    setQuestions([...qs]);
    setEditQ(null);
    toast(editQ.idx === -1 ? 'Added!' : 'Updated!', 'ok');
  };

  const resetAll = async () => {
    if (!confirm('Reset ALL team data? Cannot be undone.')) return;
    const { db } = await import('@/lib/firebase');
    const { collection, getDocs, writeBatch } = await import('firebase/firestore');
    const teamsRef = collection(db, 'teams');
    const existing = await getDocs(teamsRef);
    const batch = writeBatch(db);
    existing.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    setTeams({});
    toast('All data reset!', 'warn');
  };

  const navItems = ['Leaderboard', 'Teams', 'Anti-Cheat', 'Questions', 'Settings'];
  const navIcons: Record<string, string> = { Leaderboard: '🏆', Teams: '👥', 'Anti-Cheat': '🛡️', Questions: '❓', Settings: '⚙️' };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: C.input, border: `1.5px solid ${C.inputBorder}`,
    borderRadius: '9px', padding: '9px 12px', fontSize: '0.86rem', outline: 'none',
    color: C.text, fontFamily: "'Space Grotesk', sans-serif", transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.63rem', fontWeight: 800, letterSpacing: '1.5px', color: C.label,
    textTransform: 'uppercase', marginBottom: '4px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', background: C.bg }}>
      {/* Topbar */}
      <div style={{
        height: '56px', background: 'hsl(250 30% 8% / 0.92)', backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center',
        padding: '0 22px', gap: '14px', boxShadow: '0 2px 20px hsl(270 95% 65% / 0.1)',
      }}>
        <div className="gradient-text-animated" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.95rem', fontWeight: 900, letterSpacing: '2px' }}>🎡 SPINIGMA — TECNOPHILIA 3.0</div>
        <div style={{ background: 'hsl(0 84% 60% / 0.15)', border: '1.5px solid hsl(0 84% 60% / 0.3)', color: C.red, padding: '3px 11px', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '2px', borderRadius: '50px' }}>ADMIN</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '1px', color: C.muted }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: dbStatus === 'ok' ? C.green : dbStatus === 'err' ? C.red : C.muted, flexShrink: 0 }} />
          {dbStatus === 'ok' ? 'DB Connected ✅' : dbStatus === 'err' ? 'DB Failed ❌' : 'Checking…'}
        </div>
        <div style={{ width: '10px' }} />
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: C.green, display: 'inline-block', marginRight: '5px', animation: 'blink 1.2s infinite' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.muted }}>LIVE</span>
        <button onClick={onLogout} className="topbar-exit">✕ Exit</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '200px', flexShrink: 0, background: 'hsl(250 30% 8% / 0.7)',
          backdropFilter: 'blur(16px)', borderRight: `1px solid ${C.cardBorder}`, padding: '18px 0',
        }}>
          {navItems.map(n => (
            <div key={n} onClick={() => { setActiveNav(n); if (n === 'Leaderboard') refresh(); }}
              style={{
                padding: '12px 18px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '1.5px',
                color: activeNav === n ? C.label : C.muted, cursor: 'pointer',
                borderLeft: `3px solid ${activeNav === n ? C.primary : 'transparent'}`,
                background: activeNav === n ? 'hsl(270 95% 65% / 0.08)' : 'transparent',
                textTransform: 'uppercase', transition: 'all 0.2s',
              }}>
              {navIcons[n]} {n}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '22px', overflowY: 'auto' }}>
          {/* LEADERBOARD */}
          {activeNav === 'Leaderboard' && (
            <div>
              <div style={{
                marginBottom: '18px', paddingBottom: '11px', borderBottom: `1px solid ${C.cardBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              }}>
                <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px' }}>
                  🏆 Live Leaderboard
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={exportLeaderboardCsv}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.cardBorder}`,
                      background: 'hsl(185 90% 50% / 0.12)', color: C.accent,
                      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
                    }}
                  >⬇ CSV</button>
                  <button
                    onClick={exportLeaderboardPdf}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.cardBorder}`,
                      background: 'hsl(330 85% 60% / 0.12)', color: C.pink,
                      fontSize: '0.68rem', fontWeight: 800, letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase',
                    }}
                  >⬇ PDF</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '22px' }}>
                {[
                  { label: 'Teams', val: teamList.length, color: C.primary },
                  { label: 'Top Score', val: topScore, color: C.pink },
                  { label: 'Avg Score', val: avgScore, color: C.accent },
                  { label: 'Finished', val: doneCount, color: C.green },
                ].map(s => (
                  <div key={s.label} style={{
                    background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '14px',
                    padding: '16px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 4px 20px hsl(270 95% 65% / 0.08)',
                  }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, hsl(270 95% 65%), hsl(330 85% 60%), hsl(40 95% 60%))' }} />
                    <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.9rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '2px', color: C.muted, marginTop: '3px', textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.card, borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 20px hsl(270 95% 65% / 0.08)', border: `1px solid ${C.cardBorder}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Team-ID', 'Lead', 'Score', 'Correct', 'Wrong', 'Time', 'Switch', 'Status'].map(h => (
                        <th key={h} style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '2px', color: C.muted, textTransform: 'uppercase', textAlign: 'left', padding: '9px 11px', borderBottom: `1px solid ${C.cardBorder}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamList.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: C.muted, padding: '30px' }}>No teams yet…</td></tr>
                    ) : teamList.map((t: any) => {
                      const elapsed = getElapsed(t);
                      return (
                        <tr key={t.name} style={{ borderBottom: `1px solid hsl(250 30% 14%)` }}>
                          <td style={{ padding: '10px 11px', fontWeight: 700, fontSize: '0.86rem', color: C.text }}>{t.name}</td>
                          <td style={{ padding: '10px 11px', color: C.muted, fontWeight: 600, fontSize: '0.86rem' }}>{t.lead || '—'}</td>
                          <td style={{ padding: '10px 11px', fontFamily: "'Nunito',sans-serif", fontSize: '0.86rem', fontWeight: 800, color: C.primary }}>{t.score || 0}</td>
                          <td style={{ padding: '10px 11px', color: C.green, fontWeight: 700, fontSize: '0.86rem' }}>{t.correctCount || 0}</td>
                          <td style={{ padding: '10px 11px', color: C.red, fontWeight: 700, fontSize: '0.86rem' }}>{t.wrongCount || 0}</td>
                          <td style={{ padding: '10px 11px', fontFamily: "'Fira Code',monospace", fontSize: '0.78rem', color: C.accent }}>{elapsed === Number.MAX_SAFE_INTEGER ? '—' : fmtTime(elapsed)}</td>
                          <td style={{ padding: '10px 11px', fontSize: '0.86rem' }}>
                            {(t.tabSwitchCount || 0) > 0
                              ? <span style={{ color: C.red, fontWeight: 700 }}>{t.tabSwitchCount}</span>
                              : <span style={{ color: C.green, fontWeight: 700 }}>0</span>}
                          </td>
                          <td style={{ padding: '10px 11px', fontSize: '0.86rem' }}>
                            {t.finished
                              ? <span style={{ color: C.green, fontWeight: 700 }}>✅ Done</span>
                              : <span style={{ color: C.orange, fontWeight: 700 }}>🟡 {t.spinCount || 0}/{MAX_SPINS}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TEAMS */}
          {activeNav === 'Teams' && (
            <div>
              <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '18px', paddingBottom: '11px', borderBottom: `1px solid ${C.cardBorder}` }}>
                👥 Teams — Detailed View
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '13px' }}>
                {teamList.length === 0 ? <p style={{ color: C.muted, fontWeight: 600 }}>No teams yet.</p> :
                  teamList.map((t: any) => (
                    <div key={t.name} style={{
                      background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '14px',
                      padding: '18px', boxShadow: '0 4px 20px hsl(270 95% 65% / 0.08)',
                    }}>
                      <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem', fontWeight: 900, marginBottom: '7px' }}>🎡 {t.name}</div>
                      <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: 2, fontWeight: 600 }}>
                        Lead: <b style={{ color: C.text }}>{t.lead || '—'}</b><br />
                        Score: <b style={{ color: C.primary }}>{t.score || 0}</b><br />
                        Spins: <b style={{ color: C.accent }}>{t.spinCount || 0}/{MAX_SPINS}</b><br />
                        Correct: <b style={{ color: C.green }}>{t.correctCount || 0}</b> |
                        Wrong: <b style={{ color: C.red }}>{t.wrongCount || 0}</b><br />
                        Time: <b style={{ color: C.accent }}>{fmtTime(t.globalElapsed || 0)}</b><br />
                        {t.finished ? <span style={{ color: C.green }}>✅ Finished!</span> : <span style={{ color: C.orange }}>🟡 Active</span>}
                      </div>

                      {t.attemptLog && t.attemptLog.length > 0 && (
                        <div style={{ marginTop: '10px', borderTop: `1px solid ${C.cardBorder}`, paddingTop: '8px' }}>
                          <div style={{ ...labelStyle, marginBottom: '4px' }}>Attempt Log</div>
                          <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.72rem', color: C.muted, lineHeight: 1.8 }}>
                            {t.attemptLog.map((a: any, i: number) => (
                              <div key={i}>
                                Q{a.qIndex + 1}: {a.correct ? '✅ Correct' : '❌ Wrong'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: '9px' }}>
                        <button onClick={() => deleteTeam(t.name)} style={{
                          padding: '6px 13px', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.68rem',
                          fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase',
                          border: `1px solid hsl(0 84% 60% / 0.3)`, cursor: 'pointer', borderRadius: '7px',
                          background: 'hsl(0 84% 60% / 0.1)', color: C.red,
                        }}>🗑 Remove</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ANTI-CHEAT */}
          {activeNav === 'Anti-Cheat' && (
            <div>
              <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '18px', paddingBottom: '11px', borderBottom: `1px solid ${C.cardBorder}` }}>
                🛡️ Anti-Cheat Monitor
              </div>
              {(() => {
                const flaggedTeams = teamList.filter((t: any) => t.tabSwitchCount && t.tabSwitchCount > 0);
                const totalViolations = flaggedTeams.reduce((sum: number, t: any) => sum + (t.tabSwitchCount || 0), 0);
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '22px' }}>
                      {[
                        { label: 'Flagged Teams', val: flaggedTeams.length, color: C.red },
                        { label: 'Total Violations', val: totalViolations, color: C.orange },
                        { label: 'Clean Teams', val: teamList.length - flaggedTeams.length, color: C.green },
                      ].map(s => (
                        <div key={s.label} style={{
                          background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '14px',
                          padding: '16px', textAlign: 'center', boxShadow: '0 4px 20px hsl(270 95% 65% / 0.08)',
                        }}>
                          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.9rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '2px', color: C.muted, marginTop: '3px', textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {flaggedTeams.length === 0 ? (
                      <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '14px', padding: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <div style={{ color: C.green, fontWeight: 700, fontSize: '1rem' }}>All teams are clean!</div>
                        <div style={{ color: C.muted, fontSize: '0.8rem', marginTop: '5px' }}>No tab switching violations detected.</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '13px' }}>
                        {flaggedTeams.sort((a: any, b: any) => (b.tabSwitchCount || 0) - (a.tabSwitchCount || 0)).map((t: any) => (
                          <div key={t.name} style={{
                            background: C.card, border: `1px solid hsl(0 84% 60% / 0.3)`, borderRadius: '14px',
                            padding: '18px', boxShadow: '0 4px 20px hsl(0 84% 60% / 0.1)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem', fontWeight: 900, color: C.red }}>⚠️ {t.name}</div>
                              <div style={{
                                background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.3)',
                                color: C.red, padding: '3px 11px', fontSize: '0.65rem', fontWeight: 800,
                                letterSpacing: '1px', borderRadius: '50px',
                              }}>{t.tabSwitchCount} VIOLATION{t.tabSwitchCount > 1 ? 'S' : ''}</div>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: C.muted, lineHeight: 1.8, fontWeight: 600 }}>
                              Lead: <b style={{ color: C.text }}>{t.lead || '—'}</b><br />
                              Score: <b style={{ color: C.primary }}>{t.score || 0}</b> |
                              Status: {t.finished ? <span style={{ color: C.green }}>✅ Done</span> : <span style={{ color: C.orange }}>🟡 Active</span>}
                            </div>
                            {t.tabSwitches && t.tabSwitches.length > 0 && (
                              <div style={{ marginTop: '10px', borderTop: `1px solid ${C.cardBorder}`, paddingTop: '8px' }}>
                                <div style={{ ...labelStyle, marginBottom: '4px' }}>Violation Timeline</div>
                                <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.72rem', color: C.muted, lineHeight: 1.8 }}>
                                  {t.tabSwitches.map((s: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                      <span style={{ color: C.red }}>🔴</span>
                                      <span>Switch #{i + 1} — {new Date(s.time).toLocaleTimeString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeNav === 'Questions' && (
            <div>
              <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '18px', paddingBottom: '11px', borderBottom: `1px solid ${C.cardBorder}` }}>
                ❓ Questions ({questions.length} questions)
              </div>
              <button onClick={() => setEditQ({ idx: -1, q: { text: '', type: 'mcq', diff: 'easy', opts: ['', '', '', ''], ans: 0, hint: '', code: null } })} className="glow-btn" style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
                fontSize: '0.76rem', letterSpacing: '1px', marginBottom: '16px',
              }}>➕ Add Question</button>
              {questions.map((q, i) => (
                <div key={i} style={{
                  background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '12px',
                  padding: '13px 15px', marginBottom: '9px', display: 'flex', alignItems: 'flex-start',
                  gap: '11px', boxShadow: '0 2px 10px hsl(270 95% 65% / 0.06)',
                }}>
                  <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '0.9rem', fontWeight: 900, minWidth: '28px' }}>Q{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: C.text, marginBottom: '5px', lineHeight: 1.4 }}>{q.text}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '50px', fontSize: '0.6rem', fontWeight: 800,
                        ...(q.diff === 'easy' ? { background: 'hsl(155 80% 45% / 0.15)', color: C.green } : q.diff === 'medium' ? { background: 'hsl(40 95% 60% / 0.15)', color: 'hsl(40 95% 60%)' } : { background: 'hsl(0 84% 60% / 0.15)', color: C.red }),
                      }}>{q.diff.toUpperCase()}</span>
                      <span style={{ fontSize: '0.6rem', background: 'hsl(270 95% 65% / 0.12)', color: C.label, padding: '2px 8px', borderRadius: '50px', fontWeight: 800 }}>{q.type === 'tite' ? 'TITE' : 'MCQ'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setEditQ({ idx: i, q: { ...q } })} style={{ padding: '6px 13px', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.68rem', fontWeight: 800, border: `1px solid hsl(270 95% 65% / 0.25)`, cursor: 'pointer', borderRadius: '7px', background: 'hsl(270 95% 65% / 0.1)', color: C.label }}>✏️</button>
                    <button onClick={() => handleDeleteQ(i)} style={{ padding: '6px 13px', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.68rem', fontWeight: 800, border: `1px solid hsl(0 84% 60% / 0.3)`, cursor: 'pointer', borderRadius: '7px', background: 'hsl(0 84% 60% / 0.1)', color: C.red }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {activeNav === 'Settings' && (
            <div>
              <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.15rem', fontWeight: 900, letterSpacing: '1px', marginBottom: '18px', paddingBottom: '11px', borderBottom: `1px solid ${C.cardBorder}` }}>
                ⚙️ Settings
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: '14px', padding: '18px', maxWidth: '480px', boxShadow: '0 4px 20px hsl(270 95% 65% / 0.08)' }}>
                <div style={{ background: C.input, borderRadius: '9px', padding: '11px', fontSize: '0.78rem', color: C.muted, lineHeight: 1.7, marginBottom: '13px', fontWeight: 600 }}>
                  <b style={{ color: C.green }}>Lovable Cloud Database ✅</b><br />Data is stored securely in the cloud database. No configuration needed.
                </div>
                <button onClick={resetAll} style={{
                  padding: '12px 24px', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.82rem', fontWeight: 800,
                  border: 'none', cursor: 'pointer', borderRadius: '13px',
                  background: 'linear-gradient(135deg, hsl(0 84% 55%), hsl(25 95% 55%))', color: 'white',
                  boxShadow: '0 4px 20px hsl(0 84% 60% / 0.3)', display: 'block',
                }}>⚠ Reset All Team Data</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      {editQ && (
        <div style={{
          position: 'fixed', inset: 0, background: 'hsl(250 100% 4% / 0.7)',
          backdropFilter: 'blur(12px)', zIndex: 300, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '18px',
        }} onClick={(e) => e.target === e.currentTarget && setEditQ(null)}>
          <div style={{
            background: C.card, borderRadius: '18px', width: '100%', maxWidth: '580px',
            maxHeight: '90vh', overflowY: 'auto', padding: '24px',
            boxShadow: '0 20px 60px hsl(270 95% 65% / 0.2)',
            animation: 'mIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            border: `1px solid ${C.cardBorder}`,
          }}>
            <div className="gradient-text" style={{ fontFamily: "'Nunito',sans-serif", fontSize: '1.1rem', fontWeight: 900, marginBottom: '16px' }}>
              {editQ.idx === -1 ? '➕ Add Question' : `✏️ Edit Q${editQ.idx + 1}`}
            </div>
            <div style={{ marginBottom: '11px' }}>
              <div style={labelStyle}>Question Text *</div>
              <textarea value={editQ.q.text || ''} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, text: e.target.value } })} rows={3} placeholder="Question…" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '11px' }}>
              <div style={labelStyle}>Code Snippet (optional)</div>
              <textarea value={editQ.q.code || ''} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, code: e.target.value || null } })} rows={2} placeholder="Code…" style={{ ...inputStyle, fontFamily: "'Fira Code', monospace", fontSize: '0.83rem', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '11px', marginBottom: '11px' }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Difficulty</div>
                <select value={editQ.q.diff || 'easy'} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, diff: e.target.value as any } })} style={inputStyle}>
                  <option value="easy">Easy (+10, 30s)</option>
                  <option value="medium">Medium (+15, 45s)</option>
                  <option value="hard">Hard (+20, 60s)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Type</div>
                <select value={editQ.q.type || 'mcq'} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, type: e.target.value as any } })} style={inputStyle}>
                  <option value="mcq">MCQ</option>
                  <option value="tite">TITE</option>
                </select>
              </div>
            </div>
            {(editQ.q.type || 'mcq') === 'mcq' && (
              <>
                <div style={labelStyle}>Options *</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginBottom: '9px' }}>
                  {['A', 'B', 'C', 'D'].map((l, i) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.66rem', fontWeight: 800, color: C.muted, marginBottom: '3px' }}>{l}</div>
                      <input value={editQ.q.opts?.[i] || ''} onChange={e => {
                        const opts = [...(editQ.q.opts || ['', '', '', ''])];
                        opts[i] = e.target.value;
                        setEditQ({ ...editQ, q: { ...editQ.q, opts } });
                      }} placeholder={l} style={inputStyle} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: '11px' }}>
                  <div style={labelStyle}>Correct Answer</div>
                  <select value={typeof editQ.q.ans === 'number' ? editQ.q.ans : 0} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, ans: parseInt(e.target.value) } })} style={inputStyle}>
                    <option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option>
                  </select>
                </div>
              </>
            )}
            {editQ.q.type === 'tite' && (
              <div style={{ marginBottom: '11px' }}>
                <div style={labelStyle}>Correct Answer *</div>
                <input value={typeof editQ.q.ans === 'string' ? editQ.q.ans : ''} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, ans: e.target.value } })} placeholder="Exact answer (case-insensitive)…" style={inputStyle} />
              </div>
            )}
            <div style={{ marginBottom: '13px' }}>
              <div style={labelStyle}>Hint</div>
              <input value={editQ.q.hint || ''} onChange={e => setEditQ({ ...editQ, q: { ...editQ.q, hint: e.target.value } })} placeholder="Hint text…" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '9px' }}>
              <button onClick={handleSaveQ} className="glow-btn" style={{ flex: 1, padding: '12px', fontSize: '0.82rem', letterSpacing: '1px' }}>💾 Save</button>
              <button onClick={() => setEditQ(null)} style={{
                padding: '11px 17px', fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.68rem', fontWeight: 800,
                border: `1px solid hsl(270 95% 65% / 0.25)`, cursor: 'pointer', borderRadius: '7px',
                background: 'hsl(270 95% 65% / 0.1)', color: C.label,
              }}>✕ Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
};

export default AdminScreen;
