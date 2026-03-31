import React, { useEffect, useRef, useState, useCallback } from 'react';
import { playSpinSound } from '@/lib/sounds';

interface SpinnerWheelProps {
  divisions: number[];
  onSpinComplete: (divisionIndex: number) => void;
  disabled?: boolean;
  spinCount: number;
  maxSpins: number;
}

const COLORS = [
  '#a855f7', '#ec4899', '#f97316', '#06b6d4', '#22c55e',
  '#eab308', '#ef4444', '#3b82f6', '#8b5cf6', '#14b8a6',
  '#f43f5e', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9',
  '#a3e635', '#e879f9', '#fb923c', '#2dd4bf', '#c084fc',
  '#38bdf8', '#34d399', '#fbbf24', '#818cf8', '#22d3ee',
  '#84cc16', '#f472b6', '#fb7185', '#4ade80', '#60a5fa',
  '#facc15', '#f87171', '#a78bfa', '#0891b2', '#d946ef',
];

const SpinnerWheel: React.FC<SpinnerWheelProps> = ({
  divisions, onSpinComplete, disabled, spinCount, maxSpins,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const animRef = useRef<number>(0);
  const currentAngleRef = useRef(0);
  const [highlightedDiv, setHighlightedDiv] = useState<number | null>(null);
  const [removingDiv, setRemovingDiv] = useState<number | null>(null);

  const size = 420;
  const center = size / 2;
  const radius = size / 2 - 15;

  const drawWheel = useCallback((angle: number, highlight: number | null = null, removing: number | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    if (divisions.length === 0) {
      ctx.fillStyle = 'hsl(250, 30%, 15%)';
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'hsl(270, 95%, 65%)';
      ctx.font = "bold 18px 'Nunito', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('No divisions left!', center, center);
      return;
    }

    const sliceAngle = (Math.PI * 2) / divisions.length;

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsla(270, 95%, 65%, 0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();

    divisions.forEach((divIdx, i) => {
      const startAngle = angle + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      if (removing === divIdx) {
        ctx.globalAlpha = 0.2;
      } else if (highlight === divIdx) {
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = 0.88;
      }

      ctx.fillStyle = COLORS[divIdx % COLORS.length];
      ctx.fill();

      if (highlight === divIdx) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 25;
      } else {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      const midAngle = startAngle + sliceAngle / 2;
      const labelR = radius * 0.7;
      const x = center + Math.cos(midAngle) * labelR;
      const y = center + Math.sin(midAngle) * labelR;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${divisions.length > 20 ? 10 : 13}px 'Nunito', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText(`Q${divIdx + 1}`, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Center circle with gradient
    const grad = ctx.createRadialGradient(center, center, 0, center, center, 35);
    grad.addColorStop(0, 'hsl(250, 30%, 15%)');
    grad.addColorStop(1, 'hsl(250, 30%, 10%)');
    ctx.beginPath();
    ctx.arc(center, center, 34, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'hsl(270, 95%, 65%)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 22px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', center, center);

    // Pointer (top) with gradient
    ctx.beginPath();
    ctx.moveTo(center - 15, 4);
    ctx.lineTo(center + 15, 4);
    ctx.lineTo(center, 30);
    ctx.closePath();
    const pGrad = ctx.createLinearGradient(center, 4, center, 30);
    pGrad.addColorStop(0, '#ec4899');
    pGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = pGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [divisions, size, center, radius]);

  useEffect(() => {
    drawWheel(currentAngle, highlightedDiv, removingDiv);
  }, [currentAngle, divisions, highlightedDiv, removingDiv, drawWheel]);

  const spin = () => {
    if (spinning || disabled || divisions.length === 0 || spinCount >= maxSpins) return;
    setSpinning(true);
    setHighlightedDiv(null);
    setRemovingDiv(null);
    playSpinSound();

    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
    const targetAngle = currentAngleRef.current + totalRotation;
    const duration = 4000 + Math.random() * 1500;
    const startTime = performance.now();
    const startAngle = currentAngleRef.current;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const angle = startAngle + (targetAngle - startAngle) * eased;

      currentAngleRef.current = angle;
      setCurrentAngle(angle);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const sliceAngle = (Math.PI * 2) / divisions.length;
        const normalizedAngle = ((-(angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const pointerAngle = (normalizedAngle + (Math.PI * 3) / 2) % (Math.PI * 2);
        const landedIndex = Math.floor(pointerAngle / sliceAngle) % divisions.length;
        const landedDiv = divisions[landedIndex];

        setHighlightedDiv(landedDiv);
        setSpinning(false);
        setTimeout(() => onSpinComplete(landedDiv), 800);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  const triggerRemove = useCallback((divIdx: number) => {
    setRemovingDiv(divIdx);
    setTimeout(() => { setRemovingDiv(null); setHighlightedDiv(null); }, 600);
  }, []);

  useEffect(() => {
    (window as any).__spinnerTriggerRemove = triggerRemove;
    return () => { delete (window as any).__spinnerTriggerRemove; };
  }, [triggerRemove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px' }}>
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            filter: spinning
              ? 'drop-shadow(0 0 40px hsl(270 95% 65% / 0.6))'
              : 'drop-shadow(0 8px 30px hsl(270 95% 65% / 0.25))',
            transition: 'filter 0.3s',
          }}
        />
      </div>
      <button
        onClick={spin}
        disabled={spinning || disabled || divisions.length === 0 || spinCount >= maxSpins}
        className="glow-btn"
        style={{
          padding: '14px 44px',
          fontSize: '0.92rem',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          opacity: spinning || disabled || divisions.length === 0 ? 0.5 : 1,
          cursor: spinning || disabled || divisions.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {spinning ? '🌀 Spinning...' : `🎰 SPIN! (${spinCount}/${maxSpins})`}
      </button>
    </div>
  );
};

export default SpinnerWheel;
