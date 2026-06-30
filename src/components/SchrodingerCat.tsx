import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Box, Sparkles, AlertCircle, Play, Music } from 'lucide-react';
import { SchrodingerCatParams } from '../types';

interface SchrodingerCatProps {
  catParams: SchrodingerCatParams;
  setCatParams: React.Dispatch<React.SetStateAction<SchrodingerCatParams>>;
  triggerHapticFeedback: (event: string, intensity: number) => void;
}

export default function SchrodingerCat({
  catParams,
  setCatParams,
  triggerHapticFeedback
}: SchrodingerCatProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [displayMode, setDisplayMode] = useState<'heartbeat' | 'waveform' | '3d'>('3d');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeDCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auditory Waveform Real-time Animator Loop
  useEffect(() => {
    if (displayMode !== 'waveform' || !waveformCanvasRef.current) return;
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.fillStyle = '#010103';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.15)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.lineWidth = 1.5;

      const state = catParams.catState;
      const bpm = catParams.heartbeatFrequency;

      if (state === 'superposition') {
        // Overlay of multiple complex quantum waves (superposition of alive & dead frequencies)
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)'; // purple
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)';

        for (let x = 0; x < w; x++) {
          const wave1 = Math.sin(x * 0.08 - t * 0.08) * 15;
          const wave2 = Math.cos(x * 0.22 + t * 0.12) * 8;
          const wave3 = Math.sin(x * 0.03 - t * 0.04) * 5;
          const noise = (Math.random() - 0.5) * 1.5; // quantum fluctuations
          const y = midY + wave1 + wave2 + wave3 + noise;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary wave of lower coherence
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'; // blue
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x++) {
          const y = midY + Math.sin(x * 0.05 + t * 0.05) * 10 + Math.cos(x * 0.15 - t * 0.08) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else if (state === 'alive') {
        // Electrocardiogram (ECG) heartbeat visualizer
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)'; // emerald
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';

        for (let x = 0; x < w; x++) {
          let yOffset = 0;
          // Calculate periodic ECG wave phase matching heart speed (BPM)
          // Speed scale derived dynamically
          const waveSpeed = 0.04 * (bpm / 80);
          const phase = (x * 0.1 - t * waveSpeed) % (Math.PI * 2);
          
          // Construct P-Q-R-S-T wave complex
          if (phase > 0 && phase < 2.2) {
            if (phase < 0.4) {
              // P wave bump
              yOffset = Math.sin(phase * (Math.PI / 0.4)) * -4;
            } else if (phase >= 0.4 && phase < 0.6) {
              // PR interval flat
              yOffset = 0;
            } else if (phase >= 0.6 && phase < 0.8) {
              // Q deep dip
              yOffset = (phase - 0.6) * 20; // dip down
            } else if (phase >= 0.8 && phase < 1.1) {
              // R peak extremely sharp rise
              const rNorm = (phase - 0.8) / 0.3;
              yOffset = 4 - rNorm * 42; // peak up to -38px
            } else if (phase >= 1.1 && phase < 1.4) {
              // S deep drop
              const sNorm = (phase - 1.1) / 0.3;
              yOffset = -38 + sNorm * 44; // drop to +6px
            } else if (phase >= 1.4 && phase < 1.7) {
              // recovery segment
              yOffset = 6 - (phase - 1.4) * 20;
            } else if (phase >= 1.7 && phase < 2.2) {
              // T wave recovery bump
              yOffset = Math.sin((phase - 1.7) * (Math.PI / 0.5)) * -8;
            }
          }

          const noise = (Math.random() - 0.5) * 0.4;
          const y = midY + yOffset + noise;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else {
        // Flatline auditory state (540 Hz solid frequency)
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.95)'; // red
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';

        for (let x = 0; x < w; x++) {
          const freqSig = Math.sin(x * 0.75 + t * 0.95) * 1.5;
          const thermalNoise = (Math.random() - 0.5) * 1.2;
          const y = midY + freqSig + thermalNoise;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      t += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [displayMode, catParams.catState, catParams.heartbeatFrequency]);

  // 3D Schrödinger Wave-Function Real-time Projector Loop
  useEffect(() => {
    if (displayMode !== '3d' || !threeDCanvasRef.current) return;
    const canvas = threeDCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleX = 0.5;
    let angleY = 0.5;
    let t = 0;

    // Generate persistent 3D points representing the wave-function particles
    const particleCount = 100;
    const particles: { x: number; y: number; z: number; speed: number; size: number; phase: number; color: string }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 30 + Math.random() * 15;
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        speed: 0.01 + Math.random() * 0.02,
        size: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        color: i % 2 === 0 ? 'rgba(168, 85, 247, 0.7)' : 'rgba(56, 189, 248, 0.7)'
      });
    }

    const render = () => {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const midX = w / 2;
      const midY = h / 2;

      ctx.fillStyle = '#010103';
      ctx.fillRect(0, 0, w, h);

      // Slower, elegant rotations
      angleY += 0.008;
      angleX = 0.4 + Math.sin(t * 0.004) * 0.15;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const state = catParams.catState;
      const bpm = catParams.heartbeatFrequency;

      const drawAxis = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color: string) => {
        const project = (px: number, py: number, pz: number) => {
          let rx = px * cosY - pz * sinY;
          let rz = px * sinY + pz * cosY;
          let ry = py * cosX - rz * sinX;
          let rz2 = py * sinX + rz * cosX;
          const dist = 180;
          const scale = dist / (dist + rz2);
          return { sx: midX + rx * scale * 1.3, sy: midY + ry * scale * 1.3 };
        };
        const p1 = project(x1, y1, z1);
        const p2 = project(x2, y2, z2);
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      };

      // Subtle axes
      drawAxis(-50, 0, 0, 50, 0, 0, 'rgba(148, 163, 184, 0.12)');
      drawAxis(0, -50, 0, 0, 50, 0, 'rgba(148, 163, 184, 0.12)');
      drawAxis(0, 0, -50, 0, 0, 50, 'rgba(148, 163, 184, 0.12)');

      if (state === 'superposition') {
        // Superposition: Two beautiful intersecting wave rings (dual state spaces)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)'; // purple (Alive)
        ctx.lineWidth = 1.2;
        for (let a = 0; a <= Math.PI * 2; a += 0.08) {
          const r = 35 + Math.sin(a * 8 + t * 0.12) * 3;
          const px = r * Math.cos(a);
          const py = r * Math.sin(a);
          const pz = Math.sin(a * 4 + t * 0.08) * 4;

          let rx = px * cosY - pz * sinY;
          let rz = px * sinY + pz * cosY;
          let ry = py * cosX - rz * sinX;
          let rz2 = py * sinX + rz * cosX;

          const dist = 180;
          const scale = dist / (dist + rz2);
          const sx = midX + rx * scale * 1.3;
          const sy = midY + ry * scale * 1.3;

          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; // sky-blue (Dead)
        ctx.lineWidth = 1.0;
        for (let a = 0; a <= Math.PI * 2; a += 0.08) {
          const r = 35 + Math.cos(a * 6 - t * 0.08) * 2.5;
          const px = Math.sin(a * 2 + t * 0.05) * 3;
          const py = r * Math.cos(a);
          const pz = r * Math.sin(a);

          let rx = px * cosY - pz * sinY;
          let rz = px * sinY + pz * cosY;
          let ry = py * cosX - rz * sinX;
          let rz2 = py * sinX + rz * cosX;

          const dist = 180;
          const scale = dist / (dist + rz2);
          const sx = midX + rx * scale * 1.3;
          const sy = midY + ry * scale * 1.3;

          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.stroke();

        // Particles
        particles.forEach(p => {
          p.phase += p.speed;
          const cosP = Math.cos(0.004);
          const sinP = Math.sin(0.004);
          const tx = p.x * cosP - p.z * sinP;
          p.z = p.x * sinP + p.z * cosP;
          p.x = tx;

          const px = p.x + Math.sin(p.phase) * 1.2;
          const py = p.y + Math.cos(p.phase * 1.1) * 1.2;
          const pz = p.z + Math.sin(p.phase * 0.8) * 1.2;

          let rx = px * cosY - pz * sinY;
          let rz = px * sinY + pz * cosY;
          let ry = py * cosX - rz * sinX;
          let rz2 = py * sinX + rz * cosX;

          const dist = 180;
          const scale = dist / (dist + rz2);
          const sx = midX + rx * scale * 1.3;
          const sy = midY + ry * scale * 1.3;

          ctx.beginPath();
          ctx.fillStyle = p.color;
          ctx.arc(sx, sy, p.size * scale, 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (state === 'alive') {
        // ALIVE state: Bright green coordinate sphere pulsing in sync with heartbeat BPM
        const pulse = 1.0 + Math.max(0, Math.sin((t * (bpm / 60) * Math.PI) / 30)) * 0.12;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald
        ctx.lineWidth = 1.2;

        for (let orbit = 0; orbit < 3; orbit++) {
          const orbitAngle = (orbit * Math.PI) / 3;
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2; a += 0.1) {
            const r = 32 * pulse;
            const px = r * Math.cos(a) * Math.cos(orbitAngle);
            const py = r * Math.sin(a);
            const pz = r * Math.cos(a) * Math.sin(orbitAngle);

            let rx = px * cosY - pz * sinY;
            let rz = px * sinY + pz * cosY;
            let ry = py * cosX - rz * sinX;
            let rz2 = py * sinX + rz * cosX;

            const dist = 180;
            const scale = dist / (dist + rz2);
            const sx = midX + rx * scale * 1.3;
            const sy = midY + ry * scale * 1.3;

            if (a === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Inside glowing ball
        const r_core = 12 * pulse;
        const grad = ctx.createRadialGradient(midX, midY, 0, midX, midY, r_core * 1.4);
        grad.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
        grad.addColorStop(0.7, 'rgba(16, 185, 129, 0.08)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(midX, midY, r_core * 1.4, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // DEAD state: Decayed flat horizontal disk (dim red)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; // red
        ctx.lineWidth = 0.8;

        for (let ring = 1; ring <= 3; ring++) {
          const r = ring * 12;
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2; a += 0.12) {
            const px = r * Math.cos(a);
            const py = Math.sin(a * 6 + t * 0.15) * 0.8; // barely active flatline wave
            const pz = r * Math.sin(a);

            let rx = px * cosY - pz * sinY;
            let rz = px * sinY + pz * cosY;
            let ry = py * cosX - rz * sinX;
            let rz2 = py * sinX + rz * cosX;

            const dist = 180;
            const scale = dist / (dist + rz2);
            const sx = midX + rx * scale * 1.3;
            const sy = midY + ry * scale * 1.3;

            if (a === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.stroke();
        }

        // Collapse downward vector pointer
        drawAxis(0, 0, 0, 0, 28, 0, 'rgba(239, 68, 68, 0.7)');
        drawAxis(-3, 24, 0, 0, 28, 0, 'rgba(239, 68, 68, 0.7)');
        drawAxis(3, 24, 0, 0, 28, 0, 'rgba(239, 68, 68, 0.7)');
      }

      t += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [displayMode, catParams.catState, catParams.heartbeatFrequency]);

  // Initialize Audio Context on user gesture
  const startAudioMapping = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setIsPlayingAudio(true);
      triggerHapticFeedback('Auditory Probe Synthesizer Online', 0.65);
    } catch (e) {
      console.error('AudioContext initiation failed:', e);
    }
  };

  const stopAudioMapping = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlayingAudio(false);
    triggerHapticFeedback('Auditory Mapping Offline', 0.2);
  };

  // Synthesize sound based on cat state
  useEffect(() => {
    if (!isPlayingAudio || !audioContextRef.current) return;

    const ctx = audioContextRef.current;

    // Clear previous audio loop
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch(e){}
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    // Set up gain node for soft sound
    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.connect(ctx.destination);
    }
    gainNodeRef.current.gain.setValueAtTime(0.08, ctx.currentTime);

    if (catParams.catState === 'superposition') {
      // QUANTUM SUPERPOSITION: Overlapping dual state frequencies (beating interference pattern)
      // This represents the uncertainty before measurement
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(220, ctx.currentTime); // State A
      osc2.frequency.setValueAtTime(222.4, ctx.currentTime); // State B (creating a slow beat interference)

      osc1.connect(gainNodeRef.current);
      osc2.connect(gainNodeRef.current);

      osc1.start();
      osc2.start();

      oscillatorRef.current = osc1; // Hold reference to stop later

      // Custom periodic frequency modulation representing state fluctuations
      let freqModInterval = setInterval(() => {
        const jitter = (Math.random() - 0.5) * 8;
        osc1.frequency.linearRampToValueAtTime(220 + jitter, ctx.currentTime + 0.3);
      }, 500);

      return () => {
        clearInterval(freqModInterval);
        try { osc1.stop(); osc2.stop(); } catch(e){}
        osc1.disconnect();
        osc2.disconnect();
      };
    } else if (catParams.catState === 'alive') {
      // ALIVE STATE: Distinct rhythmic heartbeat (double click pulses)
      const playPulse = () => {
        if (!ctx || ctx.state === 'suspended') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(85, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);

        // Second beat (lub-dub)
        setTimeout(() => {
          if (!ctx || ctx.state === 'suspended') return;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(78, ctx.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          osc2.start();
          osc2.stop(ctx.currentTime + 0.18);
        }, 150);
      };

      playPulse();
      // Schedule interval matching cat heart rate
      const intervalMs = 60000 / catParams.heartbeatFrequency;
      heartbeatIntervalRef.current = setInterval(playPulse, intervalMs);
    } else {
      // DEAD STATE: Continuous high-frequency flatline pitch
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime); // Flatline alarm frequency
      osc.connect(gainNodeRef.current);
      osc.start();
      oscillatorRef.current = osc;

      return () => {
        try { osc.stop(); } catch(e){}
        osc.disconnect();
      };
    }
  }, [isPlayingAudio, catParams.catState, catParams.heartbeatFrequency]);

  // Triggers Wave Function Collapse (opening the box or acoustic measurement)
  const collapseWaveFunction = (method: 'acoustic' | 'direct') => {
    // Generate state outcome (1 for alive, 0 for dead) based on probability
    const roll = Math.random();
    const finalState = roll > 0.5 ? 'alive' : 'dead';

    // Update state parameters
    setCatParams(prev => ({
      ...prev,
      catState: finalState,
      boxOpened: method === 'direct' ? true : prev.boxOpened,
      acousticProbeActive: method === 'acoustic' ? true : prev.acousticProbeActive,
      soundMappingConfidence: method === 'acoustic' ? 98.4 : 100
    }));

    // Generate intensive haptic feedback logs
    const collapsedIntensity = finalState === 'alive' ? 0.75 : 0.95;
    triggerHapticFeedback(
      `Wave Function Collapsed [Method: ${method.toUpperCase()}] -> Result: CAT_${finalState.toUpperCase()} | $\\psi$ Eigenstate Resolved`,
      collapsedIntensity
    );

    if (navigator.vibrate) {
      // Real browser mobile vibration if supported
      navigator.vibrate(finalState === 'alive' ? [100, 50, 100] : [300, 100, 300]);
    }
  };

  const resetQuantumSuperposition = () => {
    setCatParams(prev => ({
      ...prev,
      catState: 'superposition',
      boxOpened: false,
      acousticProbeActive: false,
      soundMappingConfidence: 50
    }));
    triggerHapticFeedback('Quantum Superposition Re-established | Coherent Phase $\\psi(t)$ reset', 0.4);
  };

  return (
    <div id="schrodinger-box-panel" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <Box className="text-purple-400 w-5 h-5 animate-pulse" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              SCHRÖDINGER'S ACOUSTIC CAVITY MODEL
            </h2>
          </div>
          <span className="text-[10px] font-mono bg-purple-950/40 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
            QUANTUM COHERENCE
          </span>
        </div>

        {/* Equations Display */}
        <div className="bg-[#020205] border border-slate-900 rounded p-2.5 mb-4 font-mono text-[10px] text-slate-400">
          <div className="text-purple-400 font-bold mb-1">Time-Dependent Schrödinger Wave Equation:</div>
          <div className="bg-slate-950 p-1.5 rounded text-slate-300 text-[11px] overflow-x-auto text-center">
            {"iℏ ∂/∂t |ψ(t)⟩ = Ĥ |ψ(t)⟩"}
          </div>
          <div className="mt-2 text-slate-500 flex flex-col gap-0.5 text-[9px]">
            <div>• Superposition: <span className="text-slate-300">|ψ⟩ = α|Alive⟩ + β|Dead⟩</span></div>
            <div>• Acoustic Mapping Term: <span className="text-sky-400">f_aud(t) = a_0 ⋅ (sin(ω_H t) + η_dead ⋅ sin(ω_F t))</span></div>
            <div>• Normalized Probability: <span className="text-slate-300">|α|² + |β|² = 1</span></div>
          </div>
        </div>

        {/* Representation Monitor Mode Selector */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-slate-500 font-mono tracking-wider">REPRESENTATION MONITOR:</span>
          <div className="flex bg-slate-950/80 rounded border border-slate-900/60 p-0.5 text-[8px] font-mono gap-1">
            <button
              onClick={() => setDisplayMode('3d')}
              className={`px-2 py-0.5 rounded transition-all ${
                displayMode === '3d'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              3D Wave-Function
            </button>
            <button
              onClick={() => setDisplayMode('heartbeat')}
              className={`px-2 py-0.5 rounded transition-all ${
                displayMode === 'heartbeat'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Visual Heartbeats
            </button>
            <button
              onClick={() => setDisplayMode('waveform')}
              className={`px-2 py-0.5 rounded transition-all ${
                displayMode === 'waveform'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Auditory Waveform
            </button>
          </div>
        </div>

        {/* Visual Box Superposition / Auditory Waveform representation */}
        <div className="relative w-full h-36 rounded-lg bg-[#010103] border border-slate-900 overflow-hidden flex flex-col items-center justify-center p-4">
          {displayMode === '3d' ? (
            <div className="w-full h-full relative">
              <canvas ref={threeDCanvasRef} className="w-full h-full block" />
              <div className="absolute top-1.5 left-2 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-900/50 text-[8px] font-mono text-slate-400 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  catParams.catState === 'superposition' ? 'bg-purple-500 animate-pulse' :
                  catParams.catState === 'alive' ? 'bg-emerald-500 animate-ping' : 'bg-red-500 animate-pulse'
                }`} />
                3D SCHRÖDINGER COHERENCE PROPAGATOR
              </div>
            </div>
          ) : displayMode === 'waveform' ? (
            <div className="w-full h-full relative">
              <canvas ref={waveformCanvasRef} className="w-full h-full block" />
              <div className="absolute top-1.5 left-2 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-900/50 text-[8px] font-mono text-slate-400 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  catParams.catState === 'superposition' ? 'bg-purple-500 animate-pulse' :
                  catParams.catState === 'alive' ? 'bg-emerald-500 animate-ping' : 'bg-red-500 animate-pulse'
                }`} />
                REAL-TIME WAVE COLLAPSE MONITOR
              </div>
            </div>
          ) : catParams.catState === 'superposition' ? (
            <div className="text-center flex flex-col items-center">
              <Sparkles className="w-8 h-8 text-purple-500 animate-spin mb-1.5 duration-1000" />
              <div className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold">
                SUPERPOSITION STATE
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-1">
                Cat is both 50% Alive & 50% Dead simultaneously
              </div>
              {/* Sound Interference Waveform indicator */}
              <div className="flex items-center gap-1 mt-3">
                <span className="w-2.5 h-1 bg-purple-500 animate-bounce delay-75"></span>
                <span className="w-2.5 h-3 bg-purple-400 animate-bounce"></span>
                <span className="w-2.5 h-2 bg-purple-500 animate-bounce delay-150"></span>
                <span className="w-2.5 h-4 bg-purple-300 animate-bounce delay-75"></span>
                <span className="w-2.5 h-1 bg-purple-400 animate-bounce"></span>
              </div>
            </div>
          ) : catParams.catState === 'alive' ? (
            <div className="text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mb-1.5">
                <span className="text-emerald-400 text-[10px] font-bold">ALIVE</span>
              </div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold">
                EIGENSTATE: |ALIVE⟩
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Heartbeat detected at <span className="text-emerald-400">{catParams.heartbeatFrequency} BPM</span>
              </div>
              {/* Sound Pulse wave */}
              <div className="flex items-center gap-0.5 mt-3 h-5">
                <span className="w-1.5 h-1 bg-emerald-500"></span>
                <span className="w-1.5 h-1 bg-emerald-500"></span>
                <span className="w-1.5 h-5 bg-emerald-400"></span>
                <span className="w-1.5 h-4 bg-emerald-500"></span>
                <span className="w-1.5 h-1 bg-emerald-500"></span>
                <span className="w-1.5 h-1 bg-emerald-500"></span>
              </div>
            </div>
          ) : (
            <div className="text-center flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center mb-1.5">
                <span className="text-red-400 text-[10px] font-bold">DEAD</span>
              </div>
              <div className="text-xs font-mono text-red-500 uppercase tracking-wider font-bold">
                EIGENSTATE: |DEAD⟩
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Flatline acoustic resonance detected (<span className="text-red-400">540 Hz continuous</span>)
              </div>
              {/* Flatline line */}
              <div className="w-28 h-0.5 bg-red-500 mt-4 animate-pulse"></div>
            </div>
          )}

          {/* Absolute HUD indicator */}
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-slate-600">
            {catParams.boxOpened ? "BOX STATE: UNSEALED" : "BOX STATE: VACUUM SEALED"}
          </div>
        </div>
      </div>

      <div>
        {/* Sound Auditory Mapping control section */}
        <div className="bg-[#030409] border border-slate-900 rounded p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-slate-300 font-sans tracking-wide">
              AUDITORY STATE SONAR MAPPING
            </span>
            <button
              id="btn-toggle-acoustic-sonar"
              onClick={isPlayingAudio ? stopAudioMapping : startAudioMapping}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                isPlayingAudio
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-400/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" /> SONAR ACTIVE
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" /> SONAR MUTED
                </>
              )}
            </button>
          </div>
          <p className="text-[9px] text-slate-400 leading-normal font-mono mb-2">
            Sound is the missing parameter: Listen to the internal quantum resonance to accurately distinguish states *before* unsealing the environment.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-[8px] text-slate-500 font-mono mb-1">
                <span>RESONANCE CERTAINTY</span>
                <span className="text-sky-400">{catParams.soundMappingConfidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-300"
                  style={{ width: `${catParams.soundMappingConfidence}%` }}
                ></div>
              </div>
            </div>

            {/* Adjust beat speed rate when alive */}
            {catParams.catState === 'alive' && (
              <div className="w-24">
                <div className="flex justify-between text-[8px] text-slate-500 font-mono mb-1">
                  <span>HEART RATE</span>
                  <span className="text-emerald-400">{catParams.heartbeatFrequency} BPM</span>
                </div>
                <input
                  id="slider-heart-rate"
                  type="range"
                  min="40"
                  max="140"
                  value={catParams.heartbeatFrequency}
                  onChange={(e) => setCatParams(prev => ({ ...prev, heartbeatFrequency: parseInt(e.target.value) }))}
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            id="btn-acoustic-probe"
            onClick={() => collapseWaveFunction('acoustic')}
            disabled={catParams.catState !== 'superposition'}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-semibold font-mono text-[10px] py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Music className="w-3.5 h-3.5 text-sky-400" />
            ACOUSTIC PROBE
          </button>

          <button
            id="btn-direct-observe"
            onClick={() => collapseWaveFunction('direct')}
            disabled={catParams.catState !== 'superposition'}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold font-mono text-[10px] py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Box className="w-3.5 h-3.5" />
            OPEN BOX (OBSERVE)
          </button>

          {(catParams.catState !== 'superposition') && (
            <button
              id="btn-reset-superposition"
              onClick={resetQuantumSuperposition}
              className="px-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 rounded-lg transition-all flex items-center justify-center"
              title="Reset Superposition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
