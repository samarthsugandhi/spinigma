import React, { useState, useCallback } from 'react';
import LoginScreen from '@/components/LoginScreen';
import GameScreen from '@/components/GameScreen';
import FinishScreen from '@/components/FinishScreen';
import AdminScreen from '@/components/AdminScreen';
import { fetchQuestions, fetchTeams, saveTeamData, isAdminPassValid, getQCache } from '@/lib/gameStore';
import { getTeamQuestions, Question } from '@/lib/questions';

type Screen = 'login' | 'game' | 'finish' | 'admin';

const Index = () => {
  const [screen, setScreen] = useState<Screen>('login');
  const [teamName, setTeamName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialState, setInitialState] = useState<any>({});
  const [finishState, setFinishState] = useState<any>({});
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const toastId = React.useRef(0);

  const toast = useCallback((msg: string, type = '') => {
    const id = toastId.current++;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const handleTeamLogin = async (name: string, lead: string) => {
    const teamId = name.trim().toUpperCase();
    if (!teamId) { toast('Enter team ID!', 'err'); return; }
    if (!/^IS-TP-\d{3}$/.test(teamId)) { toast('Team ID must be like IS-TP-001', 'err'); return; }
    if (!lead.trim()) { toast('Enter the team lead name!', 'err'); return; }
    if (teamId.toLowerCase() === 'admin') { toast('Reserved name!', 'err'); return; }

    await fetchQuestions();
    const teams = await fetchTeams();
    const qs = getTeamQuestions(teamId, getQCache());

    if (teams[teamId]) {
      const t = teams[teamId];
      setInitialState({
        score: t.score || 0,
        answered: t.answered || 0,
        correctCount: t.correctCount || 0,
        wrongCount: t.wrongCount || 0,
        spinCount: t.spinCount || 0,
        usedDivisions: t.usedDivisions || [],
        attemptLog: t.attemptLog || [],
        globalElapsed: t.globalElapsed || 0,
      });
      toast(`Welcome back, ${teamId}! 🎡`, 'ok');
    } else {
      teams[teamId] = {
        name: teamId, lead, score: 0, answered: 0, correctCount: 0, wrongCount: 0,
        spinCount: 0, usedDivisions: [], attemptLog: [], finished: false, joinedAt: Date.now(), globalElapsed: 0,
      };
      await saveTeamData(teams);
      setInitialState({});
      toast(`Team "${teamId}" registered! 🎡`, 'ok');
    }

    setTeamName(teamId);
    setQuestions(qs);
    setScreen('game');
  };

  const handleAdminLogin = async (pass: string) => {
    if (!isAdminPassValid(pass)) { toast('Wrong passphrase!', 'err'); return; }
    await fetchQuestions();
    await fetchTeams();
    setScreen('admin');
  };

  const handleFinish = (state: any) => {
    setFinishState(state);
    setScreen('finish');
  };

  const handleLogout = () => {
    setScreen('login');
    setTeamName('');
    setQuestions([]);
    setInitialState({});
    setFinishState({});
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onTeamLogin={handleTeamLogin} onAdminLogin={handleAdminLogin} />}
      {screen === 'game' && <GameScreen teamName={teamName} questions={questions} initialState={initialState} onFinish={handleFinish} onLogout={handleLogout} />}
      {screen === 'finish' && <FinishScreen teamName={teamName} state={finishState} onLogout={handleLogout} />}
      {screen === 'admin' && <AdminScreen onLogout={handleLogout} />}

      {/* Global toasts for login screen */}
      {screen === 'login' && (
        <div className="toast-host">
          {toasts.map(t => (
            <div key={t.id} className={`toast-item ${t.type}`}>{t.msg}</div>
          ))}
        </div>
      )}
    </>
  );
};

export default Index;
