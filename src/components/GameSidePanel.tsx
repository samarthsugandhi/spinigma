import React from 'react';

interface GameSidePanelProps {
  side: 'left' | 'right';
  spinCount: number;
  maxSpins: number;
  availableCount: number;
  totalDivisions: number;
  globalElapsed: number;
  attemptLog: Array<{ qIndex: number; action: string; correct?: boolean }>;
}

const GameSidePanel: React.FC<GameSidePanelProps> = ({
  side, spinCount, maxSpins, availableCount, totalDivisions, attemptLog,
}) => {
  const answeredLog = attemptLog.filter(a => a.action === 'answered');
  const usedCount = totalDivisions - availableCount;
  const progressPct = Math.round((usedCount / totalDivisions) * 100);

  if (side === 'left') {
    return (
      <div className="side-panel side-panel-left">
        {/* Instructions Card */}
        <div className="sp-card sp-card-instructions animate-slide-in-left">
          <div className="sp-card-header">
            <span className="sp-card-icon">📜</span>
            <span className="sp-card-title">How to Play</span>
          </div>
          <ul className="sp-instructions-list">
            <li className="sp-instruction-item">
              <span className="sp-step-num">1</span>
              <span>Tap <strong>SPIN</strong> to spin the wheel</span>
            </li>
            <li className="sp-instruction-item">
              <span className="sp-step-num">2</span>
              <span>A question pops up — read carefully!</span>
            </li>
            <li className="sp-instruction-item">
              <span className="sp-step-num">3</span>
              <span><strong>Answer</strong> the question before timer ends</span>
            </li>
            <li className="sp-instruction-item">
              <span className="sp-step-num">4</span>
              <span>That segment disappears forever</span>
            </li>
            <li className="sp-instruction-item">
              <span className="sp-step-num">5</span>
              <span>You have <strong>{maxSpins} spins</strong> total</span>
            </li>
          </ul>
        </div>

        {/* Progress Card */}
        <div className="sp-card sp-card-progress animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
          <div className="sp-card-header">
            <span className="sp-card-icon">📊</span>
            <span className="sp-card-title">Progress</span>
          </div>
          <div className="sp-progress-bar-wrap">
            <div className="sp-progress-bar">
              <div className="sp-progress-fill" style={{ width: `${progressPct}%` }}>
                <div className="sp-progress-glow" />
              </div>
            </div>
            <div className="sp-progress-label">{usedCount}/{totalDivisions} segments used</div>
          </div>
          <div className="sp-stat-row">
            <div className="sp-stat-item">
              <span className="sp-stat-value sp-stat-spin">{spinCount}</span>
              <span className="sp-stat-label">Spins</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-value sp-stat-remaining">{availableCount}</span>
              <span className="sp-stat-label">Remaining</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-value sp-stat-left">{maxSpins - spinCount}</span>
              <span className="sp-stat-label">Spins Left</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RIGHT side: Attempted segments
  return (
    <div className="side-panel side-panel-right">
      {/* Attempted Card */}
      <div className="sp-card sp-card-attempted animate-slide-in-right">
        <div className="sp-card-header">
          <span className="sp-card-icon">📝</span>
          <span className="sp-card-title">Attempted</span>
          <span className="sp-card-badge sp-badge-attempted">{answeredLog.length}</span>
        </div>
        <div className="sp-segment-list">
          {answeredLog.length === 0 ? (
            <div className="sp-empty-state">
              <span className="sp-empty-icon">🎯</span>
              <span>No attempts yet — spin the wheel!</span>
            </div>
          ) : (
            answeredLog.map((log, i) => (
              <div key={i} className="sp-segment-chip sp-chip-attempted animate-pop-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="sp-chip-label">Q{log.qIndex + 1}</span>
                <span className="sp-chip-dot sp-dot-answered">●</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips Card */}
      <div className="sp-card sp-card-tips animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
        <div className="sp-card-header">
          <span className="sp-card-icon">💡</span>
          <span className="sp-card-title">Tips</span>
        </div>
        <div className="sp-tips-list">
          <div className="sp-tip-item">🧠 Read questions carefully before answering</div>
          <div className="sp-tip-item">⚡ Harder questions earn more points</div>
          <div className="sp-tip-item">⏱ Unanswered before timeout counts as wrong</div>
        </div>
      </div>
    </div>
  );
};

export default GameSidePanel;
