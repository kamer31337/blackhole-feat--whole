import React, { useRef, useEffect, useState } from 'react';
import { Network, Sparkles, Orbit, Cpu } from 'lucide-react';
import { SixDVector } from '../types';

interface QuantumExplorerProps {
  triggerHapticFeedback: (event: string, intensity: number, pattern?: 'pulse' | 'drift' | 'heavy tremor' | 'standard') => void;
  stabilizerFreq: number;
}

interface QuantumNode {
  pos: SixDVector;
  eigenvalue: number;
  phase: number;
  color: string;
  size: number;
  id: string;
}

export default function QuantumExplorer({ triggerHapticFeedback, stabilizerFreq }: QuantumExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dimensions, setDimensions] = useState(6); // 6D state representation
  const [couplingConstant, setCouplingConstant] = useState(0.4);
  const [hoveredNode, setHoveredNode] = useState<QuantumNode | null>(null);

  const [decayLog, setDecayLog] = useState<Array<{
    timestamp: string;
    freq: number;
    decayRate: number;
    integrity: number;
    status: 'OPTIMAL' | 'COHERENT' | 'DECAYING' | 'CRITICAL';
  }>>([]);

  const nodesRef = useRef<QuantumNode[]>([]);

  // Periodically compute entropy decay vs stabilizer frequency and update log
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const freqDelta = Math.abs(stabilizerFreq - 184.2);
      // Particle entropy decay scales with frequency delta and coupling limits
      const baseEntropy = 0.042 + freqDelta * 0.012 + (1.0 - couplingConstant) * 0.025;
      const decayRate = Math.max(0.005, baseEntropy + (Math.random() - 0.5) * 0.006);
      const integrity = Math.max(1, Math.min(100, 100 - (freqDelta * 4.5 + (1.0 - couplingConstant) * 15)));

      let status: 'OPTIMAL' | 'COHERENT' | 'DECAYING' | 'CRITICAL' = 'OPTIMAL';
      if (freqDelta > 8.0 || integrity < 40) {
        status = 'CRITICAL';
      } else if (freqDelta > 3.0 || integrity < 70) {
        status = 'DECAYING';
      } else if (freqDelta > 0.8 || integrity < 90) {
        status = 'COHERENT';
      }

      setDecayLog(prev => [
        { timestamp, freq: stabilizerFreq, decayRate, integrity, status },
        ...prev
      ].slice(0, 6));
    }, 2000);

    return () => clearInterval(interval);
  }, [stabilizerFreq, couplingConstant, isPlaying]);

  // Initialize Quantum Nodes mapping the 6D space interactions
  useEffect(() => {
    const list: QuantumNode[] = [];
    const colors = [
      'rgba(56, 189, 248, 0.85)', // Sky
      'rgba(168, 85, 247, 0.85)', // Purple
      'rgba(244, 63, 94, 0.85)',  // Rose
      'rgba(16, 185, 129, 0.85)',  // Emerald
      'rgba(245, 158, 11, 0.85)',  // Amber
      'rgba(99, 102, 241, 0.85)',  // Indigo
    ];

    for (let i = 0; i < 8; i++) {
      // Create random coordinate vectors in 6D space
      // x, y, z are standard coordinates, px, py, pz are momentum/probability phases
      const angle = (i / 8) * Math.PI * 2;
      list.push({
        id: `Ψ_${i}`,
        pos: {
          x: Math.cos(angle) * 75,
          y: Math.sin(angle) * 75,
          z: (Math.random() - 0.5) * 60,
          px: (Math.random() - 0.5) * 5,
          py: (Math.random() - 0.5) * 5,
          pz: (Math.random() - 0.5) * 5,
        },
        eigenvalue: 0.12 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 5
      });
    }

    nodesRef.current = list;
  }, []);

  // Set up resize observer on canvas container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 280;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Interaction loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#010206';
      ctx.fillRect(0, 0, w, h);

      // Draw Hilbert space orbital rings
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 1;
      for (let r = 40; r < 200; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const nodes = nodesRef.current;
      const time = isPlaying ? Date.now() * 0.001 : 0;

      // 6D Coordinate Projection calculations
      // Projects (x, y, z, px, py, pz) coordinates onto a 2D viewport
      const projectNode6D = (node: QuantumNode) => {
        // Quantum rotation with time-dependent phase
        const currentPhase = node.phase + time * 0.4;
        const radiusMultiplier = 1 + Math.sin(currentPhase) * 0.12;

        // Apply a high-dimensional folding function
        // px, py, pz modulate the rotation matrices
        const x1 = node.pos.x * radiusMultiplier;
        const y1 = node.pos.y * radiusMultiplier;

        // Add 6D momentum vector offset
        const x2 = x1 + Math.sin(node.pos.px * 0.2 + time) * 15;
        const y2 = y1 + Math.cos(node.pos.py * 0.2 + time) * 15;

        // Depth perspective mapping
        const zScale = 1.0 + (node.pos.z + Math.sin(node.pos.pz * 0.1 + time) * 20) / 200;

        return {
          id: node.id,
          x: cx + x2 * zScale,
          y: cy + y2 * zScale,
          rawZ: node.pos.z,
          scale: zScale,
          color: node.color,
          size: node.size * zScale,
          eigenvalue: node.eigenvalue,
          nodeRef: node
        };
      };

      const projected = nodes.map(projectNode6D);

      // Draw coupling interactions (high-dimensional quantum entanglement bonds)
      ctx.lineWidth = 1.2;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const n1 = projected[i];
          const n2 = projected[j];

          // Entanglement bond strength depends on eigenvalue distance and coupling constant
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (dist < 140) {
            const overlap = Math.max(0, 1 - dist / 140) * couplingConstant;
            ctx.strokeStyle = `rgba(168, 85, 247, ${overlap})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Energy packet particle flow animation along bonds
            if (isPlaying && Math.random() < 0.15) {
              const pulsePos = (Math.sin(time * 3 + i) + 1) / 2;
              const px = n1.x + (n2.x - n1.x) * pulsePos;
              const py = n1.y + (n2.y - n1.y) * pulsePos;
              ctx.fillStyle = '#f43f5e';
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Draw the state nodes
      projected.forEach((p) => {
        // Glow effect
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Node center
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eigenvalue label
        ctx.font = '8px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${p.id}: E=${p.eigenvalue.toFixed(2)}`, p.x + p.size + 2, p.y + 3);
      });

      // Simple collision checks for interaction cursor hover
      if (isPlaying) {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, couplingConstant]);

  const triggerQuantumPulse = () => {
    // Perturb all quantum node vectors slightly
    nodesRef.current.forEach(node => {
      node.pos.px += (Math.random() - 0.5) * 3;
      node.pos.py += (Math.random() - 0.5) * 3;
      node.eigenvalue = Math.min(1.0, Math.max(0.05, node.eigenvalue + (Math.random() - 0.5) * 0.15));
    });
    triggerHapticFeedback('High-Dimensional Quantum Perturbation Pulse Injected', 0.8);
  };

  return (
    <div id="quantum-explorer-panel" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <Network className="text-purple-400 w-5 h-5 animate-pulse" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              6D MULTI-DIMENSIONAL QUANTUM EXPLORER
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-sky-950/40 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded">
            6D HILBERT SPACE
          </span>
        </div>

        <p className="text-[10px] text-slate-400 leading-normal font-sans mb-3">
          Mapping particle eigenvalue state vectors $\Psi(x, y, z, p_x, p_y, p_z)$ across higher dimensions. Drag the slider to calibrate dynamic quantum entanglement coupling bounds.
        </p>

        {/* 6D Canvas visualizer container */}
        <div ref={containerRef} className="relative w-full h-44 rounded-lg bg-[#010103] border border-slate-900 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

          {/* Absolute metrics overlay */}
          <div className="absolute top-2 left-2 bg-slate-950/80 rounded p-1.5 border border-slate-800/60 text-[8px] text-slate-400 font-mono flex flex-col gap-0.5">
            <div>DIMENSION: <span className="text-sky-400">{dimensions}D COMPLEX STATE</span></div>
            <div>HERMITIAN MATRIX: <span className="text-purple-400">TRUE [H = H⁺]</span></div>
            <div>ENTANGLEMENT PROBABILITY: <span className="text-rose-400">74.2%</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {/* Sliders and custom interactions */}
        <div className="bg-[#030409] border border-slate-900 rounded p-3 mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-400">ENTANGLEMENT COUPLING CONSTANT (J):</span>
            <span className="text-xs font-mono text-purple-400">{couplingConstant.toFixed(2)}</span>
          </div>
          <input
            id="slider-entanglement-coupling"
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={couplingConstant}
            onChange={(e) => {
              setCouplingConstant(parseFloat(e.target.value));
              triggerHapticFeedback(`Quantum coupling adjusted: J = ${e.target.value}`, 0.3);
            }}
            className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-sky-400" /> Auto-Kinematic Perturbations
            </span>
            <span className="text-slate-400">ACTIVE</span>
          </div>
        </div>

        {/* Action button */}
        <button
          id="btn-quantum-pulse"
          onClick={triggerQuantumPulse}
          className="w-full bg-gradient-to-r from-sky-600/20 to-purple-600/20 hover:from-sky-500/30 hover:to-purple-500/30 text-sky-300 hover:text-white border border-sky-500/30 py-2 rounded-lg font-mono text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin" />
          INJECT HIGHER-DIMENSIONAL PERTURBATION
        </button>

        {/* Specialized Entropy Decay vs Stabilizer Frequency Log Panel */}
        <div className="mt-4 border-t border-slate-900/60 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider">ENTROPY DECAY & STABILITY LOG:</span>
            <span className="text-[8px] font-mono text-purple-400">CORRELATION SOLVER [dS/dt vs f]</span>
          </div>

          <div className="bg-slate-950/90 rounded border border-slate-900/60 p-2 text-[8.5px] font-mono flex flex-col gap-1.5 max-h-28 overflow-y-auto">
            {decayLog.length === 0 ? (
              <div className="text-center text-slate-600 py-1.5">
                Initializing real-time particle entropy telemetry...
              </div>
            ) : (
              decayLog.map((log, index) => (
                <div key={index} className="flex justify-between items-center border-b border-slate-900/40 pb-1 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{log.timestamp}</span>
                    <span className="text-slate-400">f: <span className="text-sky-400 font-bold">{log.freq.toFixed(1)} Hz</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">dS/dt: <span className="text-amber-400 font-bold">{log.decayRate.toFixed(4)} e/s</span></span>
                    <span className="text-slate-400">Wormhole: <span className="text-pink-400 font-bold">{log.integrity.toFixed(0)}%</span></span>
                    <span className={`px-1 rounded-[2px] text-[7px] font-bold ${
                      log.status === 'OPTIMAL' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/20' :
                      log.status === 'COHERENT' ? 'bg-sky-950/50 text-sky-400 border border-sky-500/20' :
                      log.status === 'DECAYING' ? 'bg-amber-950/50 text-amber-400 border border-amber-500/20' :
                      'bg-red-950/50 text-red-400 border border-red-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
