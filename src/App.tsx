import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, Orbit, ShieldAlert, Cpu, Hammer, Zap, Radio, CheckCircle, HelpCircle, Download } from 'lucide-react';
import { BlackHoleParams, WormholeParams, SchrodingerCatParams, TelemetryMetrics } from './types';
import SimulationEngine from './components/SimulationEngine';
import SchrodingerCat from './components/SchrodingerCat';
import QuantumExplorer from './components/QuantumExplorer';
import AnalyticsDashboard from './components/AnalyticsDashboard';

export default function App() {
  // 1. Black Hole Parameters State
  const [blackHole, setBlackHole] = useState<BlackHoleParams>({
    mass: 14.8, // Solar masses
    spin: 0.35, // Kerr parameter
    charge: 0.0, // Neutral
    diskSpeed: 1.2,
    distortionScale: 1.5,
    fractalLayers: 5,
    activeSingularity: 'Kerr'
  });

  // 2. Wormhole Parameters State
  const [wormhole, setWormhole] = useState<WormholeParams>({
    throatRadius: 45.0, // km
    throatLength: 120.0, // km
    stabilizerFreq: 184.2, // Current Hz
    targetFreq: 184.2, // Target resonance
    negativeEnergy: 85.0, // Keep-open energy
    isStabilized: true,
    traversalProgress: 0,
    isTraversing: false
  });

  // 3. Schrödinger's Cat Parameters State
  const [catParams, setCatParams] = useState<SchrodingerCatParams>({
    decayRate: 0.05,
    catState: 'superposition',
    acousticProbeActive: false,
    heartbeatFrequency: 82, // BPM
    isMuted: false,
    boxOpened: false,
    soundMappingConfidence: 50
  });

  // 4. Telemetry and Low-Latency Sensor State
  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    timeDilation: 1.0,
    gravitationalRedshift: 0.0,
    singularityDistance: 220, // default ship coordinate distance
    schwarzschildRadius: 43.7, // calculated value 2.95 * mass
    lightDeflectionAngle: 0.0,
    instabilityFactor: 0.0,
    hapticLogs: [],
    history: []
  });

  // 5. Physics Simulation Tick Rate Monitoring Engine
  const [tickRate, setTickRate] = useState(60.0);

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 500) {
        const rate = (frameCount * 1000) / (now - lastTime);
        setTickRate(prev => {
          const raw = prev * 0.75 + rate * 0.25;
          return Number(raw.toFixed(1));
        });
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const downloadTelemetryLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "telemetry_logs.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Helper function to insert low-latency haptic logs with specific vibration patterns
  const triggerHapticFeedback = (
    event: string,
    intensity: number,
    pattern?: 'pulse' | 'drift' | 'heavy tremor' | 'standard'
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    const id = Math.random().toString(36).substr(2, 9);

    // Auto-detect pattern if not specified
    let resolvedPattern: 'pulse' | 'drift' | 'heavy tremor' | 'standard' = pattern || 'standard';
    if (!pattern) {
      const lowerEvent = event.toLowerCase();
      if (intensity >= 0.75 || lowerEvent.includes('warp') || lowerEvent.includes('tremor') || lowerEvent.includes('critical') || lowerEvent.includes('collapse') || lowerEvent.includes('singularity') || lowerEvent.includes('throat') || lowerEvent.includes('insertion')) {
        resolvedPattern = 'heavy tremor';
      } else if (lowerEvent.includes('drift') || lowerEvent.includes('stabilizer') || lowerEvent.includes('resonance') || lowerEvent.includes('frequency') || lowerEvent.includes('harmonics') || lowerEvent.includes('calibrate') || lowerEvent.includes('instability')) {
        resolvedPattern = 'drift';
      } else if (lowerEvent.includes('pulse') || lowerEvent.includes('measurement') || lowerEvent.includes('ping') || lowerEvent.includes('observation') || lowerEvent.includes('haptic') || lowerEvent.includes('sonar')) {
        resolvedPattern = 'pulse';
      }
    }

    // Dynamic modulation of drift pattern based on instability index (target 20%)
    let customIntensity = intensity;
    let vibratePattern: number[] | number = Math.floor(intensity * 150);

    if (resolvedPattern === 'pulse') {
      vibratePattern = [60, 40, 60];
    } else if (resolvedPattern === 'drift') {
      const instability = metrics.instabilityFactor || 0;
      // Proximity ratio to 20% instability
      const proximity = Math.min(instability / 20, 1.0);
      customIntensity = 0.2 + proximity * 0.8; // subtle intensity shift
      
      const pulse1 = Math.floor(50 + proximity * 150); // 50ms up to 200ms
      const gap1 = Math.floor(180 - proximity * 120);  // 180ms down to 60ms (faster pulsing)
      const pulse2 = Math.floor(40 + proximity * 110);  // 40ms to 150ms
      vibratePattern = [pulse1, gap1, pulse2, gap1, Math.floor(pulse1 * 0.7)];
    } else if (resolvedPattern === 'heavy tremor') {
      vibratePattern = [400, 80, 400, 80, 500];
    }

    // Trigger physical device vibration API if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(vibratePattern);
      } catch (err) {
        console.warn('Physical vibration blocked:', err);
      }
    }

    setMetrics(prev => {
      const updatedLogs = [
        { id, timestamp, event, intensity: customIntensity, pattern: resolvedPattern },
        ...prev.hapticLogs
      ].slice(0, 15); // keep last 15 elements
      return { ...prev, hapticLogs: updatedLogs };
    });
  };

  // Recalculate physical metrics whenever params update
  useEffect(() => {
    // Schwarzschild radius rs = 2.95 * Mass (in km)
    const rs = 2.953 * blackHole.mass;

    // Estimate relative ship distance from singularity for coordinate dilation
    // Assuming relative visual distance mapping around 220 km
    const distance = 220;

    // Time dilation factor = 1 / sqrt(1 - rs / r)
    const dilationRatio = rs < distance ? 1 / Math.sqrt(1 - rs / distance) : 999.9;

    // Redshift factor z = 1 / sqrt(1 - rs / r) - 1
    const redshift = dilationRatio - 1;

    // Light deflection angle delta_theta = (4 * G * M) / (r * c^2) in radians, convert to degrees
    const deflection = (4 * 1.477 * blackHole.mass / distance) * (180 / Math.PI) * blackHole.distortionScale;

    // Wormhole instability factor calculation (dependent on frequency tuning delta)
    const frequencyDelta = Math.abs(wormhole.stabilizerFreq - wormhole.targetFreq);
    const instFactor = Math.min(100, Math.max(0, frequencyDelta * 3.5 + (100 - wormhole.negativeEnergy)));
    const stabilized = instFactor < 5.0;

    setMetrics(prev => ({
      ...prev,
      schwarzschildRadius: rs,
      timeDilation: dilationRatio,
      gravitationalRedshift: redshift,
      lightDeflectionAngle: deflection,
      instabilityFactor: instFactor,
      history: [
        ...prev.history,
        { time: Date.now(), instability: instFactor, redshift: redshift }
      ].slice(-100) // Keep last 100 entries
    }));

    setWormhole(prev => ({
      ...prev,
      isStabilized: stabilized
    }));
  }, [blackHole.mass, blackHole.distortionScale, wormhole.stabilizerFreq, wormhole.negativeEnergy]);

  // Handle Singularity Metric Model switches
  const handleMetricModelChange = (model: 'Schwarzschild' | 'Kerr' | 'Reissner-Nordstrom') => {
    setBlackHole(prev => ({
      ...prev,
      activeSingularity: model,
      spin: model === 'Kerr' ? 0.35 : 0.0,
      charge: model === 'Reissner-Nordstrom' ? 0.45 : 0.0
    }));
    triggerHapticFeedback(`Active metrics metric space updated: [${model.toUpperCase()}]`, 0.5);
  };

  return (
    <div className="min-h-screen bg-[#05060f] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
      {/* 1. Header Navigation HUD */}
      <header className="border-b border-slate-900/80 bg-[#080916]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-sky-500 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/10">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-slate-100 font-mono">
              COSMOS-6D : GENERAL RELATIVITY & QUANTUM ENGINE
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              6D Vector Space Visualizer • Autonomous Gravitational Singularity Analyzer
            </p>
          </div>
        </div>

        {/* Dynamic status nodes */}
        <div className="hidden md:flex items-center gap-6 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">PHYSICS ACCURACY:</span>
            <span className="text-slate-100 font-bold">10⁻¹² SEC</span>
          </div>

          <div id="header-physics-tick-rate" className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
            <span className={`w-1.5 h-1.5 rounded-full ${tickRate >= 55 ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-slate-400">PHYSICS TICK RATE:</span>
            <span className={`font-bold ${tickRate >= 55 ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>{tickRate.toFixed(1)} HZ</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="text-slate-400">WAVE FUNCTION:</span>
            <span className="text-slate-100 font-bold">{catParams.catState.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span className="text-slate-400">COSMIC GRID:</span>
            <span className="text-slate-100 font-bold">6-DIMENSIONAL</span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Row 1: The Bento Configuration Column & Simulation visualizer */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Column A: Metric parameters & Stabilizer controls */}
          {/* Column A: Metric parameters & Stabilizer controls */}
          <div className="flex flex-col gap-6 xl:col-span-1">
            {/* 1. Black Hole Parameters config */}
            <div id="blackhole-controls" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
                  <Compass className="text-amber-500 w-5 h-5" />
                  <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                    SINGULARITY PARAMETER METRICS
                  </h2>
                </div>
                <button
                  onClick={downloadTelemetryLogs}
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Download Telemetry Logs"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

                <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-900 mb-4">
                  {(['Schwarzschild', 'Kerr', 'Reissner-Nordstrom'] as const).map((m) => (
                    <button
                      key={m}
                      id={`singularity-metric-${m}`}
                      onClick={() => handleMetricModelChange(m)}
                      className={`flex-1 text-[9px] py-1 rounded font-mono transition-all ${
                        blackHole.activeSingularity === m
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m.substring(0, 11)}
                    </button>
                  ))}
                </div>

                {/* Sliders */}
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Singularity Mass ($M$):</span>
                      <span className="text-amber-400 font-bold">{blackHole.mass.toFixed(1)} $M_\odot$</span>
                    </div>
                    <input
                      id="slider-bh-mass"
                      type="range"
                      min="5"
                      max="50"
                      step="0.5"
                      value={blackHole.mass}
                      onChange={(e) => {
                        setBlackHole(prev => ({ ...prev, mass: parseFloat(e.target.value) }));
                        triggerHapticFeedback(`Spacetime curvature increased: Mass = ${e.target.value} Solar Masses`, 0.4);
                      }}
                      className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {blackHole.activeSingularity === 'Kerr' && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Ergosphere Spin Parameter ($a$):</span>
                        <span className="text-sky-400 font-bold">{(blackHole.spin * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        id="slider-bh-spin"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={blackHole.spin}
                        onChange={(e) => {
                          setBlackHole(prev => ({ ...prev, spin: parseFloat(e.target.value) }));
                          triggerHapticFeedback(`Ergosphere spin parameter modified: a = ${e.target.value}`, 0.35);
                        }}
                        className="w-full accent-sky-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  {blackHole.activeSingularity === 'Reissner-Nordstrom' && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>Singularity Charge ($Q$):</span>
                        <span className="text-rose-400 font-bold">{(blackHole.charge * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        id="slider-bh-charge"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={blackHole.charge}
                        onChange={(e) => {
                          setBlackHole(prev => ({ ...prev, charge: parseFloat(e.target.value) }));
                          triggerHapticFeedback(`Reissner-Nordstrom electrostatic potential charge set to ${e.target.value}`, 0.4);
                        }}
                        className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Light Lens Bending scale ($b_0$):</span>
                      <span className="text-emerald-400 font-bold">{blackHole.distortionScale.toFixed(2)}x</span>
                    </div>
                    <input
                      id="slider-bh-lens"
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={blackHole.distortionScale}
                      onChange={(e) => {
                        setBlackHole(prev => ({ ...prev, distortionScale: parseFloat(e.target.value) }));
                        triggerHapticFeedback(`Lensing distortion coefficient tuned: scale = ${e.target.value}`, 0.3);
                      }}
                      className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Fractal Lattice Layers:</span>
                      <span className="text-purple-400 font-bold">{blackHole.fractalLayers}</span>
                    </div>
                    <input
                      id="slider-bh-fractal-layers"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={blackHole.fractalLayers}
                      onChange={(e) => {
                        setBlackHole(prev => ({ ...prev, fractalLayers: parseInt(e.target.value) }));
                        triggerHapticFeedback(`Fractal lattice layers adjusted to ${e.target.value}`, 0.3);
                      }}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

              <p className="text-[9px] font-mono text-slate-500 leading-normal mt-4 border-t border-slate-900/60 pt-2">
                *The active metric updates space-time projections automatically in real-time.
              </p>
            </div>

            {/* 2. Wormhole Parameters config */}
            <div id="wormhole-controls" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
                  <Cpu className="text-emerald-500 w-5 h-5" />
                  <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                    ER-BRIDGE STABILIZATION FIELD
                  </h2>
                </div>

                <div className="flex items-center justify-between mb-3 bg-slate-950 p-2.5 rounded border border-slate-900">
                  <span className="text-[10px] font-mono text-slate-400">Bridge Status:</span>
                  {wormhole.isStabilized ? (
                    <span className="text-[9px] font-bold font-mono bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                      STABLE ER-RESONANCE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold font-mono bg-red-950/40 border border-red-500/20 text-red-400 px-2 py-0.5 rounded animate-pulse">
                      BRIDGE UNSTABLE (OFF-FREQ)
                    </span>
                  )}
                </div>

                {/* Sliders */}
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Stabilizer Frequency ($f_{"{"}res{"}"}$):</span>
                      <span className="text-sky-400 font-bold">{wormhole.stabilizerFreq.toFixed(1)} Hz</span>
                    </div>
                    <input
                      id="slider-wh-frequency"
                      type="range"
                      min="175"
                      max="195"
                      step="0.1"
                      value={wormhole.stabilizerFreq}
                      onChange={(e) => {
                        setWormhole(prev => ({ ...prev, stabilizerFreq: parseFloat(e.target.value) }));
                        triggerHapticFeedback(`Tuned Er-Bridge stabilizer frequency to ${e.target.value} Hz`, 0.3);
                      }}
                      className="w-full accent-sky-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Exotic Negative Mass density ($\rho_{"{"}neg{"}"}$):</span>
                      <span className="text-purple-400 font-bold">{wormhole.negativeEnergy.toFixed(0)}%</span>
                    </div>
                    <input
                      id="slider-wh-negative-energy"
                      type="range"
                      min="50"
                      max="100"
                      value={wormhole.negativeEnergy}
                      onChange={(e) => {
                        setWormhole(prev => ({ ...prev, negativeEnergy: parseInt(e.target.value) }));
                        triggerHapticFeedback(`Exotic negative energy field density set to ${e.target.value}%`, 0.45);
                      }}
                      className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex justify-between items-center bg-slate-950/80 p-2 rounded border border-slate-900 text-[10px] font-mono text-slate-400">
                    <span>Instability Index:</span>
                    <span className={metrics.instabilityFactor > 15 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {metrics.instabilityFactor.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  id="btn-auto-tune-bridge"
                  onClick={() => {
                    setWormhole(prev => ({ ...prev, stabilizerFreq: prev.targetFreq }));
                    triggerHapticFeedback('Auto-tuned stabilizer frequency to match resonance harmonics (184.2 Hz)', 0.5);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white py-1.5 rounded font-mono text-[10px] font-semibold transition-all"
                >
                  AUTO-RESOUND HARMONICS
                </button>
              </div>
            </div>

            {/* 3. Physics Simulation Diagnostics Widget */}
            <div id="sim-diagnostics-widget" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
                <Cpu className="text-sky-400 w-5 h-5" />
                <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                  PHYSICS DIAGNOSTICS & BUDGET
                </h2>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mb-3 leading-normal">
                Monitoring high-frequency 6D Einstein-Rosen coordinate mapping budget in real-time.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded">
                  <div className="text-[8px] text-slate-500 font-mono uppercase">TICK RATE</div>
                  <div className={`text-xs font-mono font-bold mt-0.5 ${tickRate >= 55 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tickRate.toFixed(1)} Hz
                  </div>
                </div>
                <div className="bg-slate-950/60 border border-slate-900 p-2.5 rounded">
                  <div className="text-[8px] text-slate-500 font-mono uppercase">TICK LATENCY</div>
                  <div className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                    {(1000 / tickRate).toFixed(1)} ms
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[8px] text-slate-500 font-mono mb-1">
                  <span>COMPUTE BUDGET MARGIN (OPTIMAL &gt; 55 Hz)</span>
                  <span className={`${tickRate >= 55 ? 'text-emerald-400' : 'text-amber-400'} font-bold`}>{Math.min(100, Math.max(0, (tickRate / 60) * 100)).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${tickRate >= 55 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, (tickRate / 60) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

          </div>

          {/* Column B: Real-time high performance 3D projection simulator */}
          <div className="xl:col-span-2 flex flex-col h-full">
            <SimulationEngine
              blackHole={blackHole}
              setBlackHole={setBlackHole}
              wormhole={wormhole}
              setWormhole={setWormhole}
              metrics={metrics}
              setMetrics={setMetrics}
              triggerHapticFeedback={triggerHapticFeedback}
            />
          </div>

        </div>

        {/* Row 2: Quantum mechanics & Auditory states (Schrödinger + Quantum explorer side by side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SchrodingerCat
            catParams={catParams}
            setCatParams={setCatParams}
            triggerHapticFeedback={triggerHapticFeedback}
          />
          <QuantumExplorer
            triggerHapticFeedback={triggerHapticFeedback}
            stabilizerFreq={wormhole.stabilizerFreq}
          />
        </div>

        {/* Row 3: Comprehensive Analytical Dashboard */}
        <AnalyticsDashboard
          blackHole={blackHole}
          wormhole={wormhole}
          catParams={catParams}
          metrics={metrics}
          setWormhole={setWormhole}
          triggerHapticFeedback={triggerHapticFeedback}
        />

      </div>

      {/* 4. Critical Instability Screen Pulse & HUD Overlay */}
      {metrics.instabilityFactor > 80 && (
        <div id="critical-instability-screen-pulse" className="fixed inset-0 pointer-events-none z-40 bg-red-600/10 mix-blend-overlay animate-pulse" style={{ animationDuration: '0.3s' }} />
      )}

      {metrics.instabilityFactor > 80 && (
        <div id="instability-warning-overlay" className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center bg-red-950/20 backdrop-blur-[1.5px] border-4 border-red-600/30 transition-all duration-500 animate-fade-in">
          <div className="bg-[#080916]/95 border-2 border-red-500/80 p-5 rounded-xl shadow-2xl max-w-sm w-full mx-4 text-center pointer-events-auto shadow-red-500/20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center animate-bounce">
              <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-black tracking-widest text-red-400 uppercase">
                COHERENCE INSTABILITY EXCEEDED
              </h2>
              <p className="text-[10px] font-mono text-slate-400 mt-2 leading-relaxed">
                Wormhole instability is currently <span className="text-red-400 font-bold">{metrics.instabilityFactor.toFixed(1)}%</span>. The ER-Bridge is undergoing immediate quantum decoherence.
              </p>
            </div>
            <button
              onClick={() => {
                setWormhole(prev => ({ ...prev, stabilizerFreq: prev.targetFreq }));
                triggerHapticFeedback('Emergency ER-Stabilizer frequency resonance auto-synced!', 1.0);
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-mono text-[9px] font-bold py-2 rounded-lg transition-all border border-red-500 animate-pulse"
            >
              TRIGGER RESU-HARMONICS SYSTEM
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
