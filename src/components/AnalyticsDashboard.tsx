import React, { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Flame, AlertOctagon, Heart, Send, Sparkles } from 'lucide-react';
import { BlackHoleParams, WormholeParams, SchrodingerCatParams, TelemetryMetrics } from '../types';

interface AnalyticsDashboardProps {
  blackHole: BlackHoleParams;
  wormhole: WormholeParams;
  catParams: SchrodingerCatParams;
  metrics: TelemetryMetrics;
  setWormhole: React.Dispatch<React.SetStateAction<WormholeParams>>;
  triggerHapticFeedback: (event: string, intensity: number, pattern?: 'pulse' | 'drift' | 'heavy tremor' | 'standard') => void;
}

export default function AnalyticsDashboard({
  blackHole,
  wormhole,
  catParams,
  metrics,
  setWormhole,
  triggerHapticFeedback
}: AnalyticsDashboardProps) {
  const [navigatorResponse, setNavigatorResponse] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stabilizationHarmonics, setStabilizationHarmonics] = useState<string>('');
  const [calibrating, setCalibrating] = useState(false);

  // Auto-correct stabilizer frequency and negative mass density density
  const handleAutoCorrection = () => {
    setWormhole(prev => ({
      ...prev,
      stabilizerFreq: prev.targetFreq,
      negativeEnergy: Math.max(prev.negativeEnergy, 96),
      isStabilized: true
    }));
    triggerHapticFeedback(
      'Emergency space-time bridge auto-correction committed: stabilizer resonant frequency matched and negative mass density normalized',
      0.9,
      'heavy tremor'
    );
  };

  // Trigger telemetry analysis automatically on mount or state changes
  const runOnboardAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/navigator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blackHole,
          wormhole,
          catState: catParams,
          metrics
        })
      });
      const data = await res.json();
      setNavigatorResponse(data.analysis);
      triggerHapticFeedback('Intelligent space-time analysis fetched', 0.5, 'pulse');
    } catch (e: any) {
      setNavigatorResponse(`⚠️ Failed to communicate with COSMOS-6D: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run stabilization optimizer (calls server)
  const runStabilizationCalibration = async () => {
    setCalibrating(true);
    try {
      const res = await fetch('/api/navigator/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wormhole })
      });
      const data = await res.json();
      setStabilizationHarmonics(data.suggestion);
      triggerHapticFeedback('Resonant stabilization calibration complete', 0.65, 'drift');
    } catch (e) {
      setStabilizationHarmonics('Unable to lock on Einstein-Rosen bridge frequency.');
    } finally {
      setCalibrating(false);
    }
  };

  useEffect(() => {
    // Debounce the telemetry analysis to prevent API exhaustion during continuous parameter changes (like dragging mass sliders)
    const timer = setTimeout(() => {
      runOnboardAiAnalysis();
    }, 1500);

    return () => clearTimeout(timer);
  }, [blackHole.mass, blackHole.activeSingularity, wormhole.isStabilized, catParams.catState]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 6D Space-Time Bridge Auto-Correction Monitor */}
      {metrics.instabilityFactor > 20 && (
        <div id="autocorrection-monitor" className="bg-[#120308] border border-rose-500/25 rounded-xl p-4.5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-3.5">
            <div className="bg-rose-500/10 border border-rose-500/40 p-2.5 rounded-lg text-rose-400 mt-0.5">
              <AlertOctagon className="w-5.5 h-5.5 animate-bounce text-rose-500" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono tracking-wider text-rose-300 uppercase">
                ⚠️ GEOMETRICAL CRITICAL MONITOR (Instability Index: {metrics.instabilityFactor.toFixed(1)}%)
              </h3>
              <p className="text-[10px] text-slate-400 font-sans mt-1 leading-normal max-w-xl">
                Einstein-Rosen bridge geometry is degrading due to frequency deviation of{' '}
                <span className="text-rose-400 font-mono font-bold">
                  {(wormhole.stabilizerFreq - wormhole.targetFreq).toFixed(2)} Hz
                </span>{' '}
                and insufficient negative energy density ({wormhole.negativeEnergy}%). Quantum containment shear is expanding.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-mono text-[9px] text-slate-400">
                <span>
                  • CURRENT FREQUENCY: <span className="text-amber-400 font-bold">{wormhole.stabilizerFreq} Hz</span>
                </span>
                <span>
                  • SUGGESTED TARGET: <span className="text-emerald-400 font-bold">{wormhole.targetFreq} Hz</span>
                </span>
                <span>
                  • MINIMUM ENERGY DENSITY: <span className="text-emerald-400 font-bold">≥96%</span>
                </span>
              </div>
            </div>
          </div>
          <button
            id="btn-execute-autocorrect"
            onClick={handleAutoCorrection}
            className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold font-mono text-[10.5px] rounded-lg shadow-md border border-rose-400/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            ENGAGE AUTO-CORRECTION LOOP
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Spacetime Physics Metrics Panel */}
      <div id="spacetime-equations-card" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
            <Compass className="text-amber-500 w-5 h-5" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              GENERAL RELATIVITY METRIC EQUATIONS
            </h2>
          </div>

          <p className="text-[10px] text-slate-400 mb-4 font-sans leading-normal">
            Real Einstein field equations used to compute orbital bending, gravitational lens coordinates, and the flow of proper time near the singularity.
          </p>

          {/* Time Dilation Equations */}
          <div className="bg-[#020205] border border-slate-900 rounded p-3 mb-3">
            <div className="text-[10px] text-amber-400 font-bold font-mono mb-1">
              Schwarzschild Coordinate Time Dilation:
            </div>
            <div className="bg-slate-950 py-2 rounded text-slate-300 text-xs text-center font-mono font-semibold">
              {"t_dil = t / sqrt(1 - (2GM / r c²))"}
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-slate-400">
              <span>Time Slowdown Factor:</span>
              <span className="text-amber-400 font-bold">{metrics.timeDilation.toFixed(4)}x</span>
            </div>
          </div>

          {/* Light Bending Equations */}
          <div className="bg-[#020205] border border-slate-900 rounded p-3 mb-3">
            <div className="text-[10px] text-sky-400 font-bold font-mono mb-1">
              Einstein Gravitational Light Deflection:
            </div>
            <div className="bg-slate-950 py-2 rounded text-slate-300 text-xs text-center font-mono font-semibold">
              {"Δθ = 4GM / r c²"}
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-slate-400">
              <span>Calculated Deflection Angle:</span>
              <span className="text-sky-400 font-bold">{metrics.lightDeflectionAngle.toFixed(2)}°</span>
            </div>
          </div>

          {/* Redshift */}
          <div className="bg-[#020205] border border-slate-900 rounded p-3">
            <div className="text-[10px] text-red-400 font-bold font-mono mb-1">
              Gravitational Redshift Factor (z):
            </div>
            <div className="bg-slate-950 py-2 rounded text-slate-300 text-xs text-center font-mono font-semibold">
              {"z = 1 / sqrt(1 - r_s / r) - 1"}
            </div>
            <div className="flex justify-between items-center mt-2 text-[9px] font-mono text-slate-400">
              <span>Redshift Shift:</span>
              <span className="text-red-400 font-bold">+{metrics.gravitationalRedshift.toFixed(4)} eV</span>
            </div>
          </div>
        </div>

        <div className="text-[8px] font-mono text-slate-600 mt-4 border-t border-slate-900/60 pt-2">
          CONSTANTS: G = 6.674e-11 | c = 299,792,458 m/s
        </div>
      </div>

      {/* 2. Onboard AI Navigator Panel (Gemini Integration) */}
      <div id="ai-navigator-card" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-sky-400 w-5 h-5 animate-pulse" />
              <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
                COSMOS-6D INTELLIGENT NAVIGATOR
              </h2>
            </div>
            <span className="text-[8px] font-mono bg-sky-950/40 border border-sky-500/20 text-sky-400 px-2 py-0.5 rounded animate-pulse">
              AI ADVISOR ONLINE
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal font-sans mb-3">
            The intelligent flight advisor utilizes natural-language analysis to calibrate wormhole harmonics, monitor spacetime metrics, and observe live quantum events.
          </p>

          <div className="bg-[#020205] rounded-lg p-3.5 border border-slate-900 min-h-[140px] text-[11px] leading-relaxed font-mono text-slate-300">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center min-h-[120px] text-slate-500">
                <span className="animate-spin w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full mb-2"></span>
                <span>RECEIVING SPACE-TIME TELEMETRY STREAM...</span>
              </div>
            ) : (
              <div>{navigatorResponse}</div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {stabilizationHarmonics && (
            <div className="bg-[#030409] p-2.5 rounded border border-purple-950/40 text-[9px] font-mono text-purple-300">
              <div className="font-bold mb-0.5">TUNER HARMONICS DIALOGUE:</div>
              {stabilizationHarmonics}
            </div>
          )}

          <div className="flex gap-2">
            <button
              id="btn-re-analyze"
              onClick={runOnboardAiAnalysis}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] py-1.5 rounded font-mono transition-colors"
            >
              PING FLIGHT COMPUTER
            </button>
            <button
              id="btn-tune-harmonics"
              onClick={runStabilizationCalibration}
              disabled={calibrating}
              className="flex-1 bg-gradient-to-r from-purple-900 to-indigo-900 hover:from-purple-800 hover:to-indigo-800 text-purple-200 text-[10px] py-1.5 rounded font-mono transition-colors border border-purple-500/20 disabled:opacity-50"
            >
              {calibrating ? 'CALIBRATING...' : 'OPTIMIZE STABILIZATION'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Haptic Logs & Sensor Data */}
      <div id="haptic-logs-card" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3 border-b border-slate-800/60 pb-2">
            <Flame className="text-rose-500 w-5 h-5 animate-pulse" />
            <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              LOW-LATENCY SENSOR & HAPTIC METRICS
            </h2>
          </div>

          <p className="text-[10px] text-slate-400 leading-normal mb-3 font-sans">
            Real-time telemetry reports capturing quantum wave collapses, micro-gravitational warp vibrations, and acoustic feedback impulses.
          </p>

          <div className="bg-[#020205] rounded-lg border border-slate-900 h-44 overflow-y-auto p-2 font-mono text-[9px] flex flex-col gap-1.5">
            {metrics.hapticLogs.length === 0 ? (
              <div className="text-slate-600 text-center py-12">No active haptic impulses recorded. Interact with thrusters or collapse quantum states to generate feedback signals.</div>
            ) : (
              metrics.hapticLogs.map(log => (
                <div key={log.id} className="p-1.5 rounded bg-slate-950 border-l-2 border-rose-500 flex justify-between items-start">
                  <div className="flex-1">
                    <span className="text-slate-500 text-[8px] mr-1">[{log.timestamp}]</span>
                    <span className="text-slate-300">{log.event}</span>
                  </div>
                  <span className="text-rose-400 font-bold ml-2">{(log.intensity * 100).toFixed(0)}% VIB</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            LATENCY: 1.4ms
          </span>
          <span>DAMPENING FIELD: ACTIVE</span>
        </div>
      </div>
    </div>
    </div>
  );
}
