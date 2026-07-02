import React, { useEffect, useRef, useState } from 'react';

interface TimeDilationSparklineProps {
  timeDilation: number;
}

export default function TimeDilationSparkline({ timeDilation }: TimeDilationSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [history, setHistory] = useState<number[]>([]);

  // Collect a rolling window of the last 60 seconds of data (sampled at ~1Hz)
  useEffect(() => {
    // Seed history with current value so it's not empty
    setHistory(prev => {
      if (prev.length === 0) {
        return Array(60).fill(timeDilation);
      }
      return prev;
    });

    const interval = setInterval(() => {
      setHistory(prev => {
        const next = [...prev, timeDilation];
        if (next.length > 60) {
          next.shift();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeDilation]);

  // Handle immediate slider updates for fluid real-time feedback
  useEffect(() => {
    setHistory(prev => {
      if (prev.length === 0) return [timeDilation];
      const next = [...prev];
      next[next.length - 1] = timeDilation; // Update current live tick with precise slider values
      return next;
    });
  }, [timeDilation]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#03040b';
    ctx.fillRect(0, 0, width, height);

    if (history.length < 2) return;

    // Find min/max for scaling
    const maxVal = Math.max(...history, 1.01);
    const minVal = Math.min(...history, 1.0);
    const range = maxVal - minVal || 1.0;

    // Calculate coords
    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * (width - 12) + 6;
      // Invert Y axis for canvas coord system and leave small margins
      const y = height - ((val - minVal) / range) * (height - 14) - 7;
      return { x, y };
    });

    // Draw grid lines
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1. Draw area fill gradient
    ctx.beginPath();
    ctx.moveTo(points[0].x, height);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
    fillGrad.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
    fillGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // 2. Draw line path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#f59e0b'; // Amber-500
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow

    // 3. Draw live pulse indicator on the latest point
    const latest = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(latest.x, latest.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }, [history]);

  const maxVal = history.length ? Math.max(...history) : timeDilation;
  const minVal = history.length ? Math.min(...history) : timeDilation;

  return (
    <div className="bg-slate-950/60 border border-slate-900/80 p-3 rounded-lg flex flex-col gap-2 mt-4">
      <div className="flex justify-between items-center text-[8px] font-mono tracking-wider text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>GRAVITATIONAL TIME DILATION DUMP</span>
        </div>
        <span className="text-slate-500">60S TELEMETRY STREAM</span>
      </div>

      <div className="relative h-12 w-full bg-[#03040b] rounded border border-slate-900 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={280}
          height={48}
          className="w-full h-full block"
        />
        {/* Dynamic visual range metrics overlay */}
        <div className="absolute top-1 left-1.5 flex flex-col text-[7px] font-mono text-slate-500">
          <span>MAX: {maxVal.toFixed(3)}x</span>
          <span>MIN: {minVal.toFixed(3)}x</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono">
        <span className="text-slate-400">CURRENT RATIO ($t'/t$):</span>
        <span className="text-amber-400 font-black tracking-wide text-xs">
          {timeDilation === 999.9 ? '∞ (EVENT HORIZON)' : `${timeDilation.toFixed(4)}x`}
        </span>
      </div>
    </div>
  );
}
