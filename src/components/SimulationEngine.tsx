import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Move3d, ShieldAlert, Navigation2, Orbit, Radio, Cpu, Activity, Sliders, Sparkles, Compass, Radar } from 'lucide-react';
import * as d3 from 'd3';
import { BlackHoleParams, WormholeParams, SixDVector, SimulationParticle, TelemetryMetrics } from '../types';
import { BlackHoleWebGLRenderer } from '../lib/blackholeWebGL';
import { DEEP_SPACE_CATALOG, DeepSpaceTarget } from '../lib/deepSpaceCatalog';

interface SimulationEngineProps {
  blackHole: BlackHoleParams;
  setBlackHole: React.Dispatch<React.SetStateAction<BlackHoleParams>>;
  wormhole: WormholeParams;
  setWormhole: React.Dispatch<React.SetStateAction<WormholeParams>>;
  metrics: TelemetryMetrics;
  setMetrics: React.Dispatch<React.SetStateAction<TelemetryMetrics>>;
  triggerHapticFeedback: (event: string, intensity: number) => void;
}

// ==========================================
// PURE TYPE-SAFE PHYSICS-INFORMED NEURAL NETWORK
// Trains live at 60 FPS using backpropagation
// Target: Predict stable Keplerian orbital velocity vectors
// ==========================================
class PhysicsInformedNN {
  weights1: number[][]; // [input_dim: 3][hidden_dim: 5]
  biases1: number[];    // [hidden_dim: 5]
  weights2: number[][]; // [hidden_dim: 5][output_dim: 3]
  biases2: number[];    // [output_dim: 3]
  learningRate: number = 0.015;

  constructor() {
    // Xavier/Glorot-like initialization
    this.weights1 = Array.from({ length: 3 }, () =>
      Array.from({ length: 5 }, () => (Math.random() - 0.5) * Math.sqrt(2 / 3))
    );
    this.biases1 = Array.from({ length: 5 }, () => (Math.random() - 0.5) * 0.1);

    this.weights2 = Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => (Math.random() - 0.5) * Math.sqrt(2 / 5))
    );
    this.biases2 = Array.from({ length: 3 }, () => (Math.random() - 0.5) * 0.1);
  }

  // Forward Pass
  predict(x: number, y: number, z: number) {
    const input = [x / 150, y / 150, z / 150]; // Normalized coordinate inputs
    
    // Hidden layer with Tanh activation
    const hidden: number[] = [];
    for (let j = 0; j < 5; j++) {
      let sum = this.biases1[j];
      for (let i = 0; i < 3; i++) {
        sum += input[i] * this.weights1[i][j];
      }
      hidden.push(Math.tanh(sum));
    }

    // Output layer (linear outputs: target optimal px, py, pz)
    const output: number[] = [];
    for (let k = 0; k < 3; k++) {
      let sum = this.biases2[k];
      for (let j = 0; j < 5; j++) {
        sum += hidden[j] * this.weights2[j][k];
      }
      output.push(sum);
    }

    return {
      px: output[0],
      py: output[1],
      pz: output[2],
      hiddenStates: hidden
    };
  }

  // Dynamic Backpropagation with Keplerian target gradient descent
  train(x: number, y: number, z: number, targetPx: number, targetPy: number, targetPz: number) {
    const input = [x / 150, y / 150, z / 150];
    
    // 1. Forward Pass & Cache
    const hiddenSum: number[] = [];
    const hidden: number[] = [];
    for (let j = 0; j < 5; j++) {
      let sum = this.biases1[j];
      for (let i = 0; i < 3; i++) {
        sum += input[i] * this.weights1[i][j];
      }
      hiddenSum.push(sum);
      hidden.push(Math.tanh(sum));
    }

    const output: number[] = [];
    for (let k = 0; k < 3; k++) {
      let sum = this.biases2[k];
      for (let j = 0; j < 5; j++) {
        sum += hidden[j] * this.weights2[j][k];
      }
      output.push(sum);
    }

    // 2. Compute error (Target - Prediction)
    const targets = [targetPx, targetPy, targetPz];
    const outputErrors = output.map((out, k) => targets[k] - out);

    // 3. Backprop to Output Layer (Delta 2)
    const dWeights2: number[][] = Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => 0));
    const dBiases2 = [...outputErrors];

    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 3; k++) {
        dWeights2[j][k] = outputErrors[k] * hidden[j];
      }
    }

    // 4. Backprop to Hidden Layer (Delta 1)
    const hiddenErrors = Array.from({ length: 5 }, () => 0);
    for (let j = 0; j < 5; j++) {
      let err = 0;
      for (let k = 0; k < 3; k++) {
        err += outputErrors[k] * this.weights2[j][k];
      }
      // derivative of tanh is 1 - tanh^2
      hiddenErrors[j] = err * (1 - hidden[j] * hidden[j]);
    }

    const dWeights1: number[][] = Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => 0));
    const dBiases1 = [...hiddenErrors];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        dWeights1[i][j] = hiddenErrors[j] * input[i];
      }
    }

    // 5. Gradient updates
    for (let j = 0; j < 5; j++) {
      for (let k = 0; k < 3; k++) {
        this.weights2[j][k] += dWeights2[j][k] * this.learningRate;
      }
    }
    for (let k = 0; k < 3; k++) {
      this.biases2[k] += dBiases2[k] * this.learningRate;
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 5; j++) {
        this.weights1[i][j] += dWeights1[i][j] * this.learningRate;
      }
    }
    for (let j = 0; j < 5; j++) {
      this.biases1[j] += dBiases1[j] * this.learningRate;
    }

    // Return Mean Squared Error
    return outputErrors.reduce((sum, err) => sum + err * err, 0) / 3;
  }
}

export default function SimulationEngine({
  blackHole,
  setBlackHole,
  wormhole,
  setWormhole,
  metrics,
  setMetrics,
  triggerHapticFeedback
}: SimulationEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [showFluxMap, setShowFluxMap] = useState(false);
  const [activeTab, setActiveTab] = useState<'blackhole' | 'wormhole'>('blackhole');
  const [shipPos, setShipPos] = useState<SixDVector>({ x: 0, y: 0, z: 220, px: 0.1, py: -0.1, pz: 0.05 });
  const [rotation, setRotation] = useState({ theta: 0.8, phi: 1.2 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [isWarping, setIsWarping] = useState(false);

  const [selectedTarget, setSelectedTarget] = useState<DeepSpaceTarget>(DEEP_SPACE_CATALOG[0]);
  const webglRendererRef = useRef<BlackHoleWebGLRenderer | null>(null);
  const prevMassRef = useRef(blackHole.mass);
  const prevSpinRef = useRef(blackHole.spin);
  const rippleTriggerRef = useRef(0.0);

  // Initialize WebGL offscreen renderer once on mount
  useEffect(() => {
    webglRendererRef.current = new BlackHoleWebGLRenderer();
  }, []);

  // Monitor parameters to trigger vertex shader gravitational waves (ripples)
  useEffect(() => {
    let changed = false;
    if (blackHole.mass !== prevMassRef.current) {
      prevMassRef.current = blackHole.mass;
      changed = true;
    }
    if (blackHole.spin !== prevSpinRef.current) {
      prevSpinRef.current = blackHole.spin;
      changed = true;
    }
    if (changed) {
      rippleTriggerRef.current = 1.0; // max ripple amplitude
      triggerHapticFeedback('Gravitational Wave Transverse Ripples Propagation Active', 0.8);
    }
  }, [blackHole.mass, blackHole.spin, triggerHapticFeedback]);

  // Sync stabilizer frequency with astronomical target to lock link and update targetFreq
  const isTargetLocked = Math.abs(wormhole.stabilizerFreq - selectedTarget.resonanceFreq) < 0.6;
  useEffect(() => {
    setWormhole(prev => {
      const needsStabilizedUpdate = isTargetLocked !== prev.isStabilized;
      const needsTargetFreqUpdate = selectedTarget.resonanceFreq !== prev.targetFreq;
      if (needsStabilizedUpdate || needsTargetFreqUpdate) {
        return {
          ...prev,
          isStabilized: isTargetLocked,
          targetFreq: selectedTarget.resonanceFreq
        };
      }
      return prev;
    });

    if (isTargetLocked && !wormhole.isStabilized) {
      triggerHapticFeedback('Wormhole Harmonic Resonance Coordinate System Locked!', 0.95);
    }
  }, [isTargetLocked, wormhole.isStabilized, selectedTarget.resonanceFreq, setWormhole, triggerHapticFeedback]);

  const d3SvgRef = useRef<SVGSVGElement | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 600, height: 450 });

  // Multi-touch & Mouse gesture tracking refs
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchAngleRef = useRef<number | null>(null);
  const initialShipZRef = useRef<number | null>(null);
  const initialThetaRef = useRef<number | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number | null>(null);

  const lastMouseXRef = useRef<number | null>(null);
  const lastMouseYRef = useRef<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Gesture HUD visual feedback state
  const [gestureState, setGestureState] = useState<{
    isActive: boolean;
    type: 'none' | 'drag' | 'pinch' | 'rotate' | 'multi';
    zoomScale: number;
    rotationDelta: number;
  }>({
    isActive: false,
    type: 'none',
    zoomScale: 1.0,
    rotationDelta: 0,
  });

  // Responsive Viewport Resize Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = Math.floor(entry.contentRect.width);
        const height = Math.floor(entry.contentRect.height);

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
          setCanvasDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Multi-Touch Event Handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      lastTouchXRef.current = touch.clientX;
      lastTouchYRef.current = touch.clientY;
      setGestureState({
        isActive: true,
        type: 'drag',
        zoomScale: 1.0,
        rotationDelta: 0,
      });
      if (autoRotate) setAutoRotate(false);
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      initialTouchDistanceRef.current = distance;
      initialTouchAngleRef.current = angle;
      initialShipZRef.current = shipPos.z;
      initialThetaRef.current = rotation.theta;

      setGestureState({
        isActive: true,
        type: 'multi',
        zoomScale: 1.0,
        rotationDelta: 0,
      });
      if (autoRotate) setAutoRotate(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && lastTouchXRef.current !== null && lastTouchYRef.current !== null) {
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchXRef.current;
      const dy = touch.clientY - lastTouchYRef.current;

      lastTouchXRef.current = touch.clientX;
      lastTouchYRef.current = touch.clientY;

      setRotation(prev => {
        const newTheta = (prev.theta - dx * 0.007) % (Math.PI * 2);
        const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, prev.phi - dy * 0.007));
        return { theta: newTheta, phi: newPhi };
      });

      setGestureState(prev => ({ ...prev, type: 'drag' }));
    } else if (
      e.touches.length === 2 &&
      initialTouchDistanceRef.current !== null &&
      initialTouchAngleRef.current !== null &&
      initialShipZRef.current !== null &&
      initialThetaRef.current !== null
    ) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];

      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const distanceRatio = distance / initialTouchDistanceRef.current;
      const targetZ = Math.max(25, Math.min(420, initialShipZRef.current / distanceRatio));
      setShipPos(prev => ({ ...prev, z: targetZ }));

      const angleDelta = angle - initialTouchAngleRef.current;
      const targetTheta = (initialThetaRef.current + angleDelta) % (Math.PI * 2);
      setRotation(prev => ({ ...prev, theta: targetTheta }));

      setGestureState({
        isActive: true,
        type: 'multi',
        zoomScale: distanceRatio,
        rotationDelta: (angleDelta * 180) / Math.PI,
      });
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
    initialTouchAngleRef.current = null;
    initialShipZRef.current = null;
    initialThetaRef.current = null;
    lastTouchXRef.current = null;
    lastTouchYRef.current = null;

    setGestureState({
      isActive: false,
      type: 'none',
      zoomScale: 1.0,
      rotationDelta: 0,
    });
  };

  // Mouse Orbit Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;
    setIsMouseDown(true);
    if (autoRotate) setAutoRotate(false);
    setGestureState({
      isActive: true,
      type: 'drag',
      zoomScale: 1.0,
      rotationDelta: 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown || lastMouseXRef.current === null || lastMouseYRef.current === null) return;
    const dx = e.clientX - lastMouseXRef.current;
    const dy = e.clientY - lastMouseYRef.current;

    lastMouseXRef.current = e.clientX;
    lastMouseYRef.current = e.clientY;

    setRotation(prev => {
      const newTheta = (prev.theta - dx * 0.007) % (Math.PI * 2);
      const newPhi = Math.max(0.1, Math.min(Math.PI - 0.1, prev.phi - dy * 0.007));
      return { theta: newTheta, phi: newPhi };
    });
  };

  const handleMouseUpOrLeave = () => {
    if (isMouseDown) {
      setIsMouseDown(false);
      lastMouseXRef.current = null;
      lastMouseYRef.current = null;
      setGestureState({
        isActive: false,
        type: 'none',
        zoomScale: 1.0,
        rotationDelta: 0,
      });
    }
  };

  // Dynamic D3.js 6D Probability Density Flux Map Loop
  useEffect(() => {
    if (!showFluxMap || !d3SvgRef.current) return;

    let animId: number;

    const tick = () => {
      if (!d3SvgRef.current) return;
      const svg = d3.select(d3SvgRef.current);
      const width = containerRef.current?.clientWidth || 600;
      const height = containerRef.current?.clientHeight || 500;
      const centerX = width / 2;
      const centerY = height / 2;

      // Define the radial orbits dataset based on current mass and charge parameters
      const warpScale = 1 + (blackHole.mass * 0.02) + (blackHole.charge * 0.12);
      const orbits = [
        { id: 'inner', r: 40 * warpScale, color: '#38bdf8', dash: '3, 6', weight: 1.5, name: 'Quantum Ergosurface' },
        { id: 'middle', r: 85 * warpScale, color: '#a855f7', dash: '5, 10', weight: 2.0, name: 'Cauchy Horizon Flux' },
        { id: 'outer', r: 145 * warpScale, color: '#f43f5e', dash: '2, 8', weight: 1.0, name: 'De Sitter Boundary' },
        { id: 'photon', r: 200 * warpScale, color: '#10b981', dash: '6, 12', weight: 1.2, name: 'Keplerian Limit' }
      ];

      // Update orbits
      const orbitSelection = svg.select('.d3-orbits-group')
        .selectAll<SVGCircleElement, typeof orbits[0]>('circle')
        .data(orbits, d => d.id);

      // Enter
      orbitSelection.enter()
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('fill', 'none')
        .attr('stroke', d => d.color)
        .attr('stroke-width', d => d.weight)
        .attr('stroke-dasharray', d => d.dash)
        .attr('opacity', 0.4)
        .attr('r', d => d.r);

      // Update
      orbitSelection
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('stroke', d => d.color)
        .attr('stroke-width', d => d.weight)
        .attr('stroke-dasharray', d => d.dash)
        .attr('r', d => d.r)
        .attr('opacity', 0.45);

      // Exit
      orbitSelection.exit().remove();

      // Update 6D vectors
      const numVectors = 8;
      const vectorsData = Array.from({ length: numVectors }).map((_, i) => {
        const angle = (i * Math.PI / 4) + (Date.now() * 0.0004);
        const orbitalRadius = 110 * warpScale + Math.sin(Date.now() * 0.0012 + i) * 12;
        const x1 = centerX + Math.cos(angle) * orbitalRadius;
        const y1 = centerY + Math.sin(angle) * orbitalRadius;

        const tangentAngle = angle + Math.PI / 2 + 0.15 * (1 + blackHole.charge * 0.6);
        const arrowLen = 22 + blackHole.mass * 0.35;
        const x2 = x1 + Math.cos(tangentAngle) * arrowLen;
        const y2 = y1 + Math.sin(tangentAngle) * arrowLen;

        const probAmp = (0.2 + Math.abs(Math.sin(Date.now() * 0.0008 + i * 1.5)) * 0.6 + (blackHole.charge * 0.15)).toFixed(3);

        return {
          id: i,
          x1, y1, x2, y2,
          tangentAngle,
          probAmp
        };
      });

      const vectorSelection = svg.select('.d3-vectors-group')
        .selectAll<SVGGElement, typeof vectorsData[0]>('g.d3-vector')
        .data(vectorsData, d => d.id);

      // Enter
      const vectorEnter = vectorSelection.enter()
        .append('g')
        .attr('class', 'd3-vector');

      vectorEnter.append('line')
        .attr('stroke', 'url(#fluxFlowGrad)')
        .attr('stroke-width', 2.2)
        .attr('stroke-linecap', 'round');

      vectorEnter.append('polygon')
        .attr('fill', '#38bdf8')
        .attr('opacity', 0.85);

      vectorEnter.append('text')
        .attr('fill', 'rgba(56, 189, 248, 0.95)')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace');

      // Merge & update
      const mergedVectors = vectorSelection.merge(vectorEnter as any);

      mergedVectors.select('line')
        .attr('x1', d => d.x1)
        .attr('y1', d => d.y1)
        .attr('x2', d => d.x2)
        .attr('y2', d => d.y2);

      mergedVectors.select('polygon')
        .attr('points', d => {
          const { x2, y2, tangentAngle } = d;
          const angleLeft = tangentAngle - 0.4;
          const angleRight = tangentAngle + 0.4;
          return `${x2},${y2} ${x2 - 5 * Math.cos(angleLeft)},${y2 - 5 * Math.sin(angleLeft)} ${x2 - 5 * Math.cos(angleRight)},${y2 - 5 * Math.sin(angleRight)}`;
        });

      mergedVectors.select('text')
        .attr('x', d => d.x1 + 10)
        .attr('y', d => d.y1 - 6)
        .text(d => `|ψ_6d⟩=${d.probAmp}`);

      vectorSelection.exit().remove();

      animId = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(animId);
  }, [showFluxMap, blackHole.mass, blackHole.charge, isPlaying]);

  // Neural Network state parameters
  const [isNNActive, setIsNNActive] = useState(true);
  const [nnLearningRate, setNnLearningRate] = useState(0.015);
  const [nnLoss, setNnLoss] = useState(0.042);
  const [nnEpochs, setNnEpochs] = useState(1240);
  const [nnOptimizationStrength, setNnOptimizationStrength] = useState(0.65); // 0 (none) to 1 (full NN guidance)

  // Initialize PINN instance
  const pinnRef = useRef<PhysicsInformedNN>(new PhysicsInformedNN());
  const particlesRef = useRef<SimulationParticle[]>([]);
  const flareParticlesRef = useRef<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
  }[]>([]);

  // Monitor resize event
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 500;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync learning rate change
  useEffect(() => {
    pinnRef.current.learningRate = nnLearningRate;
  }, [nnLearningRate]);

  // Particle Initialization
  useEffect(() => {
    const initParticles = () => {
      const list: SimulationParticle[] = [];
      const count = activeTab === 'blackhole' ? 1400 : 900; // computational detailed particles

      for (let i = 0; i < count; i++) {
        if (activeTab === 'blackhole') {
          const angle = Math.random() * Math.PI * 2;
          // Dense inner ring concentration mimicking accretion physical density curve
          const u = Math.random();
          const radius = 34 + Math.pow(u, 2.5) * 175;

          // Radial temperature gradient: white-hot in inner, gold-yellow mid, crimson-red outer
          let startColor = '';
          if (radius < 52) {
            startColor = `hsl(${40 + Math.random() * 15}, 100%, ${88 + Math.random() * 12}%)`;
          } else if (radius < 95) {
            startColor = `hsl(${32 + Math.random() * 12}, 100%, ${65 + Math.random() * 15}%)`;
          } else {
            startColor = `hsl(${15 + Math.random() * 15}, 100%, ${48 + Math.random() * 14}%)`;
          }

          list.push({
            pos: {
              x: Math.cos(angle) * radius,
              y: (Math.random() - 0.5) * 6, // thin disc height
              z: Math.sin(angle) * radius,
              px: -Math.sin(angle) * (1.1 + Math.random() * 0.4), // Keplerian orbital momentum
              py: (Math.random() - 0.5) * 0.08,
              pz: Math.cos(angle) * (1.1 + Math.random() * 0.4),
            },
            color: startColor,
            size: 0.6 + Math.random() * 2.2,
            alpha: 0.35 + Math.random() * 0.65,
            speed: 0.7 + Math.random() * 0.8,
            life: Math.random() * 320,
            maxLife: 300 + Math.random() * 200,
            type: Math.random() > 0.4 ? 'disk' : 'lensed'
          });
        } else {
          const angle = Math.random() * Math.PI * 2;
          const zDepth = (Math.random() - 0.5) * 320;
          const r = wormhole.throatRadius * 0.5 + Math.random() * 45;
          list.push({
            pos: {
              x: Math.cos(angle) * r,
              y: Math.sin(angle) * r,
              z: zDepth,
              px: (Math.random() - 0.5) * 0.2,
              py: (Math.random() - 0.5) * 0.2,
              pz: -2.2 - Math.random() * 2.8,
            },
            color: `hsl(${185 + Math.random() * 65}, 100%, ${72 + Math.random() * 18}%)`,
            size: 1.0 + Math.random() * 2.2,
            alpha: 0.4 + Math.random() * 0.6,
            speed: 1.6 + Math.random() * 1.8,
            life: Math.random() * 220,
            maxLife: 200 + Math.random() * 100,
            type: 'wormhole-dust'
          });
        }
      }
      particlesRef.current = list;
    };

    initParticles();
  }, [activeTab, blackHole.activeSingularity]);

  // Main high-performance simulation loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!ctx || !canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#010206';
      ctx.fillRect(0, 0, w, h);

      const rs = metrics.schwarzschildRadius;

      // Orbital parameters with optional automatic 3D rotation
      let currentTheta = rotation.theta;
      let currentPhi = rotation.phi;

      if (autoRotate && isPlaying) {
        const elapsedSeconds = Date.now() / 1000;
        currentTheta = (rotation.theta + elapsedSeconds * 0.15) % (Math.PI * 2);
        currentPhi = rotation.phi + Math.sin(elapsedSeconds * 0.12) * 0.18;
      }

      const cosT = Math.cos(currentTheta);
      const sinT = Math.sin(currentTheta);
      const cosP = Math.cos(currentPhi);
      const sinP = Math.sin(currentPhi);

      // Custom 6D projection fold
      const project6D = (vec: SixDVector) => {
        let x1 = vec.x * cosT - vec.z * sinT;
        let z1 = vec.x * sinT + vec.z * cosT;
        let y1 = vec.y * cosP - z1 * sinP;
        let z2 = vec.y * sinP + z1 * cosP;

        // Multi-dimensional momentum twist (using 6D momentum elements)
        const twistAngle = 0.022 * blackHole.distortionScale;
        x1 += vec.px * Math.cos(vec.pz * twistAngle);
        y1 += vec.py * Math.sin(vec.pz * twistAngle);
        z2 += vec.pz * 0.05;

        // Forward gravitational lensing warp (Interstellar-style Einstein ring bending)
        if (activeTab === 'blackhole') {
          const r2d = Math.sqrt(x1 * x1 + y1 * y1);
          const rs3d = rs * 1.15; // Einstein ring alignment
          if (z2 > -rs3d && r2d > 0.01) {
            // zWeight is 0 for particles in front, 1 for particles behind
            const zWeight = Math.max(0, Math.min(1, (z2 + rs3d) / (rs3d * 2.2)));
            const r_actual = r2d;
            // Analytical Einstein deflection approximation
            const r_apparent = 0.5 * (r_actual + Math.sqrt(r_actual * r_actual + 4 * rs3d * rs3d * zWeight));
            const lensFactor = r_apparent / r_actual;
            x1 *= lensFactor;
            y1 *= lensFactor;
          }
        }

        const eyeZ = shipPos.z;
        const aspect = w / h;
        const aspectScale = aspect < 1.0 ? Math.max(0.48, aspect * 0.95) : 1.0;
        const scale = (380 * aspectScale) / (z2 + eyeZ);
        return {
          x: cx + (x1 - shipPos.x) * scale,
          y: cy + (y1 - shipPos.y) * scale,
          depth: z2,
          visible: (z2 + eyeZ) > 8,
          scaleFactor: scale
        };
      };

      const soundInstability = wormhole.isStabilized ? 0 : metrics.instabilityFactor / 100;
      const pinn = pinnRef.current;

      let batchLossAccumulator = 0;
      let batchCount = 0;

      // Project center of the black hole
      const rsProj = project6D({ x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0 });

      // ==========================================
      // PROCEDURAL SPACETIME MANIFOLD DRIFT GRID
      // Generates horizontal and vertical grid lines warped by gravity center with moving drift waves
      // modulated by the instability index
      // ==========================================
      const instabilityIdx = metrics.instabilityFactor / 100;
      const driftOpacity = Math.max(0.06, instabilityIdx * 0.48);
      const timeSec = Date.now() / 1000;
      const gravityCx = rsProj.visible ? rsProj.x : cx;
      const gravityCy = rsProj.visible ? rsProj.y : cy;

      ctx.lineWidth = 1.0;
      ctx.strokeStyle = `rgba(14, 165, 233, ${driftOpacity * 0.4})`;

      // Horizontal grid lines
      const stepSize = 40;
      for (let gridY = stepSize / 2; gridY < h; gridY += stepSize) {
        ctx.beginPath();
        for (let gridX = 0; gridX <= w; gridX += 10) {
          const dx = gridX - gravityCx;
          const dy = gridY - gravityCy;
          const d = Math.sqrt(dx * dx + dy * dy);

          const pull = activeTab === 'blackhole'
            ? (rsProj.visible ? Math.min(180, (metrics.schwarzschildRadius * rsProj.scaleFactor * 140) / (d + 35)) : 0)
            : Math.min(150, (wormhole.throatRadius * 120) / (d + 35));

          let rx = gridX;
          let ry = gridY;

          if (d > 5) {
            rx -= (dx / d) * pull;
            ry -= (dy / d) * pull;
          }

          const driftPhase = gridX * 0.015 - timeSec * (2.8 + instabilityIdx * 7.5);
          const driftWobble = Math.sin(driftPhase) * (2.0 + instabilityIdx * 24.0);
          ry += driftWobble * (pull / (pull + 18));

          if (gridX === 0) {
            ctx.moveTo(rx, ry);
          } else {
            ctx.lineTo(rx, ry);
          }
        }
        ctx.stroke();
      }

      // Vertical grid lines
      for (let gridX = stepSize / 2; gridX < w; gridX += stepSize) {
        ctx.beginPath();
        for (let gridY = 0; gridY <= h; gridY += 10) {
          const dx = gridX - gravityCx;
          const dy = gridY - gravityCy;
          const d = Math.sqrt(dx * dx + dy * dy);

          const pull = activeTab === 'blackhole'
            ? (rsProj.visible ? Math.min(180, (metrics.schwarzschildRadius * rsProj.scaleFactor * 140) / (d + 35)) : 0)
            : Math.min(150, (wormhole.throatRadius * 120) / (d + 35));

          let rx = gridX;
          let ry = gridY;

          if (d > 5) {
            rx -= (dx / d) * pull;
            ry -= (dy / d) * pull;
          }

          const driftPhase = gridY * 0.015 - timeSec * (2.8 + instabilityIdx * 7.5);
          const driftWobble = Math.sin(driftPhase) * (2.0 + instabilityIdx * 24.0);
          rx += driftWobble * (pull / (pull + 18));

          if (gridY === 0) {
            ctx.moveTo(rx, ry);
          } else {
            ctx.lineTo(rx, ry);
          }
        }
        ctx.stroke();
      }

      // Gravitational lens / space bending background warp effect centered on the real projected black hole
      if (activeTab === 'blackhole' && rsProj.visible) {
        const rsWarp = rs * 1.5;
        const rsWarpScaled = rsWarp * rsProj.scaleFactor;
        if (rsWarpScaled > 4) {
          ctx.beginPath();
          const radGradiant = ctx.createRadialGradient(
            rsProj.x, rsProj.y, rsWarpScaled * 0.4,
            rsProj.x, rsProj.y, rsWarpScaled * 3.2
          );
          radGradiant.addColorStop(0, 'rgba(0, 0, 0, 1)');
          radGradiant.addColorStop(0.18, 'rgba(12, 6, 25, 0.95)');
          radGradiant.addColorStop(0.48, 'rgba(239, 68, 68, 0.22)');
          radGradiant.addColorStop(0.78, 'rgba(249, 115, 22, 0.08)');
          radGradiant.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = radGradiant;
          ctx.arc(rsProj.x, rsProj.y, rsWarpScaled * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update particle positions first
      const particles = particlesRef.current;
      if (isPlaying) {
        // --- ADDITIVE FLARE PARTICLES DYNAMIC SPONSORING & COORDINATES MAPPING ---
        if (activeTab === 'blackhole') {
          const flares = flareParticlesRef.current;
          const instability = metrics.instabilityFactor || 0;
          
          // Spawn rate scales dynamically in intensity based on the 'instabilityFactor' metrics
          const spawnChance = instability / 100;
          const numToSpawn = Math.floor(spawnChance * 8) + (Math.random() < (spawnChance * 8) % 1 ? 1 : 0);
          
          for (let i = 0; i < numToSpawn; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = rs * (1.0 + Math.random() * 0.45); // spawn near the event horizon (rs)
            
            // Outer explosive direction velocities
            const theta = Math.random() * Math.PI;
            const phi = Math.random() * Math.PI * 2;
            const speedScale = 1.0 + (instability / 40); // faster, more energetic at high instability
            
            const vx = Math.sin(theta) * Math.cos(phi) * (1.2 + Math.random() * 2.8) * speedScale;
            const vy = (Math.random() - 0.5) * 1.8 * speedScale; // slightly flat profile
            const vz = Math.sin(theta) * Math.sin(phi) * (1.2 + Math.random() * 2.8) * speedScale;
            
            // Color shifts from hot orange to electric violet-magenta under critical stress
            const hue = Math.max(0, Math.min(360, 24 - (instability * 0.6) + (Math.random() * 12)));
            
            flares.push({
              x: Math.cos(angle) * r,
              y: (Math.random() - 0.5) * 5,
              z: Math.sin(angle) * r,
              vx,
              vy,
              vz,
              life: 0,
              maxLife: 25 + Math.floor(Math.random() * 35),
              color: `hsl(${hue < 0 ? hue + 360 : hue}, 100%, ${55 + Math.random() * 20}%)`,
              size: 2.0 + Math.random() * 4.0
            });
          }
          
          // Update and age existing flares
          flareParticlesRef.current = flares
            .map((f) => {
              // Gravitational pull / spin influence
              let rx = f.x + f.vx;
              let ry = f.y + f.vy;
              let rz = f.z + f.vz;
              
              // Apply simple fluidic deceleration
              return {
                ...f,
                x: rx,
                y: ry,
                z: rz,
                vx: f.vx * 0.965,
                vy: f.vy * 0.965,
                vz: f.vz * 0.965,
                life: f.life + 1
              };
            })
            .filter((f) => f.life < f.maxLife);
        }

        particles.forEach((p) => {
          if (activeTab === 'blackhole') {
            const dist = Math.sqrt(p.pos.x * p.pos.x + p.pos.y * p.pos.y + p.pos.z * p.pos.z);

            if (dist < rs + 2.5) {
              // Sucked in. Recirculate
              const angle = Math.random() * Math.PI * 2;
              const radius = 170 + Math.random() * 90;
              p.pos.x = Math.cos(angle) * radius;
              p.pos.y = (Math.random() - 0.5) * 6;
              p.pos.z = Math.sin(angle) * radius;
              p.pos.px = -Math.sin(angle) * (1.1 + Math.random() * 0.4);
              p.pos.py = (Math.random() - 0.5) * 0.08;
              p.pos.pz = Math.cos(angle) * (1.1 + Math.random() * 0.4);
              p.color = `hsl(${15 + Math.random() * 15}, 100%, ${48 + Math.random() * 14}%)`;
              p.life = 0;
              return;
            }

            // Real General Relativity Gravitational Force
            const force = (blackHole.mass * 0.022) / (dist * dist * (1 - rs / dist + 0.001));
            const targetAx = -p.pos.x * force;
            const targetAy = -p.pos.y * force;
            const targetAz = -p.pos.z * force;

            // Ideal stable orbital momentum targets (Keplerian)
            const angle = Math.atan2(p.pos.z, p.pos.x);
            const idealPx = -Math.sin(angle) * (1.2 * blackHole.diskSpeed);
            const idealPy = 0;
            const idealPz = Math.cos(angle) * (1.2 * blackHole.diskSpeed);

            // NEURAL NETWORK INTERACTION: Online Physics-Informed Training Step
            if (isNNActive) {
              const loss = pinn.train(p.pos.x, p.pos.y, p.pos.z, idealPx, idealPy, idealPz);
              batchLossAccumulator += loss;
              batchCount++;
            }

            // Neural guiding correction
            let guidedPx = p.pos.px;
            let guidedPy = p.pos.py;
            let guidedPz = p.pos.pz;

            if (isNNActive && nnOptimizationStrength > 0.02) {
              // Retrieve optimal path predicted by PINN model
              const prediction = pinn.predict(p.pos.x, p.pos.y, p.pos.z);
              // Blend Newtonian/Einsteinian velocities with the Neural prediction
              guidedPx = p.pos.px * (1 - nnOptimizationStrength) + prediction.px * nnOptimizationStrength;
              guidedPy = p.pos.py * (1 - nnOptimizationStrength) + prediction.py * nnOptimizationStrength;
              guidedPz = p.pos.pz * (1 - nnOptimizationStrength) + prediction.pz * nnOptimizationStrength;
            }

            // Gravity integration
            p.pos.px += targetAx * p.speed;
            p.pos.py += targetAy * p.speed;
            p.pos.pz += targetAz * p.speed;

            // Drag frames (Kerr spin)
            if (blackHole.activeSingularity === 'Kerr') {
              const dragFactor = blackHole.spin * 0.065;
              const dragAngle = Math.atan2(p.pos.z, p.pos.x) + dragFactor;
              const curRadius = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
              p.pos.x = Math.cos(dragAngle) * curRadius;
              p.pos.z = Math.sin(dragAngle) * curRadius;
            }

            // Apply guiding blending
            p.pos.px = guidedPx;
            p.pos.py = guidedPy;
            p.pos.pz = guidedPz;

            // Step coordinate coordinates
            p.pos.x += p.pos.px * p.speed * 0.32;
            p.pos.y += p.pos.py * p.speed * 0.32;
            p.pos.z += p.pos.pz * p.speed * 0.32;

            p.life++;
          } else {
            // Wormhole Throat kinematics
            p.pos.z += p.pos.pz * p.speed * 0.52;

            if (soundInstability > 0.01) {
              const vib = soundInstability * 4.2;
              p.pos.x += (Math.random() - 0.5) * vib;
              p.pos.y += (Math.random() - 0.5) * vib;
            }

            // Recycle
            if (p.pos.z < -260) {
              p.pos.z = 260;
              const angle = Math.random() * Math.PI * 2;
              const r = wormhole.throatRadius * 0.5 + Math.random() * 55;
              p.pos.x = Math.cos(angle) * r;
              p.pos.y = Math.sin(angle) * r;
            }
          }
        });
      }

      // Build depth-sorted list of renderable elements
      interface RenderableItem {
        type: 'particle' | 'singularity' | 'spin_ring' | 'throat_glow' | 'webgl_disk' | 'flare';
        depth: number;
        data: any;
      }

      const drawItems: RenderableItem[] = [];
      const hasWebGL = !!webglRendererRef.current && webglRendererRef.current.isSupported();

      // Add particles to drawing queue
      particles.forEach((p) => {
        // Replace discrete particles with the continuous WebGL flow field in black hole mode!
        if (activeTab === 'blackhole' && hasWebGL) {
          return;
        }
        const proj = project6D(p.pos);
        if (proj.visible && proj.x > 0 && proj.x < w && proj.y > 0 && proj.y < h) {
          drawItems.push({
            type: 'particle',
            depth: proj.depth,
            data: { p, proj }
          });
        }
      });

      // Add flare particles to drawing queue (drawn even in WebGL continuous accretion disk mode!)
      if (activeTab === 'blackhole') {
        const flares = flareParticlesRef.current;
        flares.forEach((f) => {
          const proj = project6D({ x: f.x, y: f.y, z: f.z, px: f.vx, py: f.vy, pz: f.vz });
          if (proj.visible && proj.x > 0 && proj.x < w && proj.y > 0 && proj.y < h) {
            drawItems.push({
              type: 'flare',
              depth: proj.depth,
              data: { f, proj }
            });
          }
        });
      }

      // Add central structures
      if (activeTab === 'blackhole') {
        if (rsProj.visible) {
          // Push WebGL continuous accretion disk
          if (hasWebGL) {
            drawItems.push({
              type: 'webgl_disk',
              depth: rsProj.depth + 0.1, // draws around the event horizon depth
              data: { rsProj }
            });
          }

          drawItems.push({
            type: 'singularity',
            depth: rsProj.depth, // 0
            data: { rsProj }
          });

          if (blackHole.spin > 0.05) {
            drawItems.push({
              type: 'spin_ring',
              depth: rsProj.depth + 0.1, // slightly shifted to render next to singularity
              data: { rsProj }
            });
          }
        }
      } else {
        const throatProj = project6D({ x: 0, y: 0, z: 0, px: 0, py: 0, pz: 0 });
        if (throatProj.visible) {
          drawItems.push({
            type: 'throat_glow',
            depth: throatProj.depth,
            data: { throatProj }
          });
        }
      }

      // Sort items by depth in descending order:
      // Larger depth (furthest from observer) drawn first.
      // Smaller depth (closest to observer) drawn last.
      drawItems.sort((a, b) => b.depth - a.depth);

      // Render all items in depth order
      drawItems.forEach((item) => {
        if (item.type === 'particle') {
          const { p, proj } = item.data;
          const brightness = Math.min(1, p.life / 50) * Math.max(0.12, 1 - Math.abs(proj.depth) / 400);

          let drawColor = p.color;
          if (activeTab === 'blackhole') {
            const dist = Math.sqrt(p.pos.x * p.pos.x + p.pos.y * p.pos.y + p.pos.z * p.pos.z);
            const dopplerVelocity = p.pos.pz; // line of sight proxy

            // Gravitational redshift: increases as particle approaches event horizon (rs)
            const localHorizonProximity = Math.max(0, rs / Math.max(0.2, dist - rs));
            const gravShift = localHorizonProximity * (1.0 + metrics.gravitationalRedshift * 0.5);

            // Shift Hue dynamically to capture Doppler and GR effects
            let hue = 32; // Default warm orange hue for disk particles
            let saturation = 100;
            let lightness = 65;

            if (dopplerVelocity < -0.15) {
              // Approaching particles: Doppler Blueshift (shift hue towards cyan-blue)
              const shiftRatio = Math.min(1.0, Math.abs(dopplerVelocity) / 2.0);
              hue = Math.floor(32 + shiftRatio * 170);
            } else {
              // Receding or close to event horizon: Doppler & Gravitational Redshift
              const shiftRatio = Math.min(1.0, (dopplerVelocity > 0 ? dopplerVelocity / 2.0 : 0) + gravShift * 0.15);
              hue = Math.floor(32 - shiftRatio * 32); // transitions orange to blood red (0)
              lightness = Math.max(30, Math.floor(65 - shiftRatio * 25));
            }

            drawColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          }

          // Compute trail starting point for fluid flow string mapping
          const trailLengthFactor = activeTab === 'blackhole' ? 0.75 : 0.45;
          const prevPos = {
            x: p.pos.x - p.pos.px * p.speed * trailLengthFactor,
            y: p.pos.y - p.pos.py * p.speed * trailLengthFactor,
            z: p.pos.z - p.pos.pz * p.speed * trailLengthFactor,
            px: p.pos.px,
            py: p.pos.py,
            pz: p.pos.pz
          };
          const projPrev = project6D(prevPos);

          if (p.life > 1 && projPrev.visible) {
            // Draw wide glowing outer gas trail
            ctx.beginPath();
            ctx.moveTo(projPrev.x, projPrev.y);
            ctx.lineTo(proj.x, proj.y);
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = p.size * Math.max(0.15, proj.scaleFactor) * (activeTab === 'blackhole' ? 2.5 : 1.8);
            ctx.globalAlpha = p.alpha * brightness * (activeTab === 'blackhole' ? 0.45 : 0.3);
            ctx.lineCap = 'round';
            ctx.stroke();

            // Draw bright inner core trail representing dense plasma stream
            ctx.beginPath();
            ctx.moveTo(projPrev.x, projPrev.y);
            ctx.lineTo(proj.x, proj.y);
            ctx.strokeStyle = activeTab === 'blackhole' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(230, 248, 255, 0.82)';
            ctx.lineWidth = p.size * Math.max(0.15, proj.scaleFactor) * 0.7;
            ctx.globalAlpha = p.alpha * brightness * 0.8;
            ctx.lineCap = 'round';
            ctx.stroke();
          } else {
            // Fallback for first frame of particle cycle
            ctx.beginPath();
            ctx.fillStyle = drawColor;
            ctx.globalAlpha = p.alpha * brightness;
            ctx.arc(proj.x, proj.y, p.size * Math.max(0.15, proj.scaleFactor), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (item.type === 'singularity') {
          const { rsProj: pProj } = item.data;
          const rsScaled = rs * pProj.scaleFactor;
          if (rsScaled > 2) {
            // Draw Event Horizon shadow with highly polished, smooth, fuzzy edge blurring (glow)
            ctx.beginPath();
            ctx.arc(pProj.x, pProj.y, rsScaled, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.shadowBlur = 24;
            ctx.shadowColor = '#000000';
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw a gorgeous photon sphere gravitational boundary light lens around the horizon to blend and smoothen particles beautifully
            const photonGradiant = ctx.createRadialGradient(
              pProj.x, pProj.y, rsScaled * 0.85,
              pProj.x, pProj.y, rsScaled * 1.35
            );
            photonGradiant.addColorStop(0, 'rgba(0, 0, 0, 1)');
            photonGradiant.addColorStop(0.15, 'rgba(239, 68, 68, 0.45)');
            photonGradiant.addColorStop(0.5, 'rgba(249, 115, 22, 0.28)');
            photonGradiant.addColorStop(0.85, 'rgba(251, 191, 36, 0.08)');
            photonGradiant.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.beginPath();
            ctx.arc(pProj.x, pProj.y, rsScaled * 1.35, 0, Math.PI * 2);
            ctx.fillStyle = photonGradiant;
            ctx.fill();
          }
        } else if (item.type === 'flare') {
          const { f, proj } = item.data;
          const alpha = Math.sin((f.life / f.maxLife) * Math.PI); // Fade in/out profile
          
          // Use additive blending for bright energetic flare glow
          const originalComposite = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = 'screen';
          
          ctx.beginPath();
          const flareSize = f.size * Math.max(0.12, proj.scaleFactor);
          
          // Setup a glowing gradient with a hot white core
          const flareGrad = ctx.createRadialGradient(
            proj.x, proj.y, 0,
            proj.x, proj.y, flareSize * 1.8
          );
          flareGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
          flareGrad.addColorStop(0.35, f.color);
          flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = flareGrad;
          ctx.globalAlpha = alpha * 0.95;
          ctx.arc(proj.x, proj.y, flareSize * 1.8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 1.0; // Reset alpha
          ctx.globalCompositeOperation = originalComposite; // Reset composite
        } else if (item.type === 'spin_ring') {
          const { rsProj: pProj } = item.data;
          const rsScaled = rs * pProj.scaleFactor;
          ctx.beginPath();
          const width = rsScaled * (1 + blackHole.spin * 0.65);
          const height = rsScaled;
          ctx.ellipse(pProj.x, pProj.y, width, height, currentTheta, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (item.type === 'webgl_disk') {
          const { rsProj: pProj } = item.data;
          const webgl = webglRendererRef.current;
          if (webgl) {
            webgl.setSize(w, h);
            
            // Slowly decay the ripple trigger parameter
            rippleTriggerRef.current = Math.max(0, rippleTriggerRef.current - 0.012);
            
            const webglCanvas = webgl.draw({
              time: Date.now() / 1000,
              mass: blackHole.mass,
              spin: blackHole.spin,
              charge: blackHole.charge,
              instability: metrics.instabilityFactor / 100,
              rippleTrigger: rippleTriggerRef.current,
              fractalLayers: blackHole.fractalLayers,
              rotation: currentTheta
            });
            
            if (webglCanvas) {
              const diskSize = 340 * pProj.scaleFactor;
              if (diskSize > 12) {
                ctx.drawImage(
                  webglCanvas,
                  pProj.x - diskSize / 2,
                  pProj.y - diskSize / 2,
                  diskSize,
                  diskSize
                );
              }
            }
          }
        } else if (item.type === 'throat_glow') {
          const { throatProj: pProj } = item.data;
          const rScaled = wormhole.throatRadius * pProj.scaleFactor;
          
          if (rScaled > 5) {
            // ==========================================
            // DEEP SPACE REAL COORDINATES RENDERER
            // Renders the lensed celestial view through the portal
            // ==========================================
            ctx.save();
            ctx.beginPath();
            ctx.arc(pProj.x, pProj.y, rScaled * 0.96, 0, Math.PI * 2);
            ctx.clip();
            
            // Clear space background inside throat
            ctx.fillStyle = '#01020a';
            ctx.fillRect(pProj.x - rScaled, pProj.y - rScaled, rScaled * 2, rScaled * 2);
            
            // Draw Right Ascension and Declination guide lines
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
            ctx.lineWidth = 1;
            const numLines = 8;
            for (let idx = 0; idx < numLines; idx++) {
              const angle = (idx / numLines) * Math.PI * 2 + (Date.now() / 12000);
              ctx.beginPath();
              ctx.moveTo(pProj.x, pProj.y);
              ctx.lineTo(pProj.x + Math.cos(angle) * rScaled, pProj.y + Math.sin(angle) * rScaled);
              ctx.stroke();
            }
            // Dec rings
            for (let rIdx = 0.25; rIdx < 1.0; rIdx += 0.25) {
              ctx.beginPath();
              ctx.arc(pProj.x, pProj.y, rScaled * rIdx, 0, Math.PI * 2);
              ctx.stroke();
            }
            
            // Draw celestial starfield
            ctx.fillStyle = '#ffffff';
            const starRotation = (Date.now() / 25000);
            for (let s = 0; s < 40; s++) {
              const starAngle = (s * 137.5) * Math.PI / 180 + starRotation;
              const starRadius = (Math.sin(s * 74.3) * 0.5 + 0.5) * rScaled * 0.9;
              const sx = pProj.x + Math.cos(starAngle) * starRadius;
              const sy = pProj.y + Math.sin(starAngle) * starRadius;
              
              const size = (0.6 + Math.random() * 1.4) * (1.0 - starRadius / rScaled);
              ctx.beginPath();
              ctx.arc(sx, sy, Math.max(0.4, size), 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Draw central celestial target illustration
            ctx.save();
            ctx.translate(pProj.x, pProj.y);
            ctx.rotate(Date.now() / 6000); // slow scenic rotation
            
            if (selectedTarget.id === 'sgr-a') {
              // Sagittarius A* supermassive black hole view
              const sgrR = rScaled * 0.38;
              ctx.beginPath();
              ctx.arc(0, 0, sgrR, 0, Math.PI * 2);
              const sgrGrad = ctx.createRadialGradient(0, 0, sgrR * 0.2, 0, 0, sgrR);
              sgrGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
              sgrGrad.addColorStop(0.2, 'rgba(251, 146, 60, 0.92)');
              sgrGrad.addColorStop(0.65, 'rgba(244, 63, 94, 0.35)');
              sgrGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = sgrGrad;
              ctx.fill();
              
              ctx.beginPath();
              ctx.arc(0, 0, sgrR * 0.24, 0, Math.PI * 2);
              ctx.fillStyle = '#000000';
              ctx.fill();
            } else if (selectedTarget.id === 'andromeda') {
              // Andromeda spiral galaxy view
              const galaxyR = rScaled * 0.44;
              ctx.beginPath();
              ctx.ellipse(0, 0, galaxyR, galaxyR * 0.45, -0.3, 0, Math.PI * 2);
              const andromGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, galaxyR);
              andromGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
              andromGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.72)');
              andromGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.24)');
              andromGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = andromGrad;
              ctx.fill();
              
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.lineWidth = 0.8;
              for (let arm = 0; arm < 4; arm++) {
                ctx.beginPath();
                const armStartAngle = arm * (Math.PI / 2);
                for (let t = 0; t < Math.PI * 2.5; t += 0.05) {
                  const r = Math.pow(t / (Math.PI * 2.5), 0.8) * galaxyR;
                  const theta = armStartAngle + t + r * 0.05;
                  const ax = Math.cos(theta) * r;
                  const ay = Math.sin(theta) * r * 0.45;
                  const cosSlant = Math.cos(-0.3);
                  const sinSlant = Math.sin(-0.3);
                  const rx = ax * cosSlant - ay * sinSlant;
                  const ry = ax * sinSlant + ay * cosSlant;
                  if (t === 0) ctx.moveTo(rx, ry);
                  else ctx.lineTo(rx, ry);
                  
                  // Add stars
                  if (t % 0.5 < 0.05) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.beginPath();
                    ctx.arc(rx, ry, Math.random() * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                  }
                }
                ctx.stroke();
              }
            } else if (selectedTarget.id === 'kepler-186f') {
              // Kepler terrestrial exo-world planet sphere
              const planetR = rScaled * 0.28;
              ctx.beginPath();
              ctx.arc(0, 0, planetR, 0, Math.PI * 2);
              const planetGrad = ctx.createRadialGradient(-planetR * 0.2, -planetR * 0.2, planetR * 0.1, 0, 0, planetR);
              planetGrad.addColorStop(0, '#34d399');
              planetGrad.addColorStop(0.65, '#047857');
              planetGrad.addColorStop(1, '#022c22');
              ctx.fillStyle = planetGrad;
              ctx.fill();
              
              ctx.beginPath();
              ctx.arc(0, 0, planetR * 1.15, 0, Math.PI * 2);
              const planetGlow = ctx.createRadialGradient(0, 0, planetR, 0, 0, planetR * 1.15);
              planetGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
              planetGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
              ctx.fillStyle = planetGlow;
              ctx.fill();
            } else {
              // Crab Nebula Red Supernova Remnant Pulsar
              const nebR = rScaled * 0.42;
              ctx.beginPath();
              ctx.arc(0, 0, nebR, 0, Math.PI * 2);
              const nebGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, nebR);
              nebGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
              nebGrad.addColorStop(0.35, 'rgba(244, 63, 94, 0.65)');
              nebGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.2)');
              nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = nebGrad;
              ctx.fill();
              
              ctx.beginPath();
              ctx.moveTo(0, -nebR * 1.25);
              ctx.lineTo(0, nebR * 1.25);
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
              ctx.lineWidth = 2.0;
              ctx.stroke();
              
              const pulseFactor = 0.5 + 0.5 * Math.sin(Date.now() / 120);
              ctx.beginPath();
              ctx.arc(0, 0, nebR * 0.12 * pulseFactor, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
            }
            ctx.restore();
            
            if (!isTargetLocked) {
              ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
              ctx.fillRect(-rScaled, -rScaled, rScaled * 2, rScaled * 2);
              
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.28)';
              ctx.lineWidth = 1.0;
              for (let scan = -rScaled; scan < rScaled; scan += 5) {
                const scanOffset = (Math.random() - 0.5) * 6;
                ctx.beginPath();
                ctx.moveTo(-rScaled, scan + scanOffset);
                ctx.lineTo(rScaled, scan + scanOffset);
                ctx.stroke();
              }
              
              ctx.font = 'bold 8px monospace';
              ctx.fillStyle = '#f43f5e';
              ctx.textAlign = 'center';
              ctx.fillText('SIGNAL DECOHERED', 0, 3);
            } else {
              ctx.font = 'bold 8px Courier New, monospace';
              ctx.fillStyle = '#10b981';
              ctx.textAlign = 'center';
              ctx.fillText('LINK LOCK', 0, -rScaled * 0.65);
              
              ctx.font = '7px monospace';
              ctx.fillStyle = '#38bdf8';
              ctx.fillText(selectedTarget.name.toUpperCase(), 0, rScaled * 0.72);
            }
            
            ctx.restore();
          }

          // Glowing Ring Border
          ctx.beginPath();
          ctx.arc(pProj.x, pProj.y, rScaled, 0, Math.PI * 2);
          const borderGradiant = ctx.createRadialGradient(
            pProj.x, pProj.y, rScaled - 12,
            pProj.x, pProj.y, rScaled + 16
          );
          borderGradiant.addColorStop(0, 'rgba(56, 189, 248, 0)');
          borderGradiant.addColorStop(0.5, isTargetLocked ? 'rgba(56, 189, 248, 0.88)' : 'rgba(239, 68, 68, 0.95)');
          borderGradiant.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = borderGradiant;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1.0;

      // Update neural network epoch stats periodically
      if (isPlaying && isNNActive && batchCount > 0) {
        const meanLoss = batchLossAccumulator / batchCount;
        setNnLoss(prev => prev * 0.95 + meanLoss * 0.05);
        setNnEpochs(prev => prev + 1);
      }

      // Navigation target HUD indicators
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.strokeStyle = isWarping ? 'rgba(239, 68, 68, 0.9)' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 6, cy);
      ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy - 6);
      ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy + 20);
      ctx.strokeStyle = isWarping ? 'rgba(239, 68, 68, 0.65)' : 'rgba(56, 189, 248, 0.4)';
      ctx.stroke();

      if (isWarping) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(0, 0, w, h);
      }

      // Metadata indicators
      ctx.font = '9px Courier New, monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`6D VECTOR_X: ${shipPos.x.toFixed(2)}`, 15, 20);
      ctx.fillText(`6D VECTOR_Y: ${shipPos.y.toFixed(2)}`, 15, 32);
      ctx.fillText(`6D VECTOR_Z: ${shipPos.z.toFixed(2)}`, 15, 44);

      if (isPlaying) {
        animationId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying, activeTab, shipPos, rotation, autoRotate, blackHole, wormhole, metrics, isNNActive, nnOptimizationStrength, canvasDimensions]);

  // Method to draw synaptic neural weights live overlay on canvas
  const drawLiveSynapticNet = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const startX = w - 170;
    const startY = h - 130;
    const layerSpacing = 50;
    const nodeSpacing = 16;

    const inputCount = 3;
    const hiddenCount = 5;
    const outputCount = 3;

    const pinn = pinnRef.current;

    // Node Positions
    const inputY = (i: number) => startY + (hiddenCount - inputCount) * (nodeSpacing / 2) + i * nodeSpacing;
    const hiddenY = (j: number) => startY + j * nodeSpacing;
    const outputY = (k: number) => startY + (hiddenCount - outputCount) * (nodeSpacing / 2) + k * nodeSpacing;

    // 1. Draw synaptic lines Input -> Hidden
    ctx.lineWidth = 1.0;
    for (let i = 0; i < inputCount; i++) {
      for (let j = 0; j < hiddenCount; j++) {
        const weight = pinn.weights1[i][j];
        // Blue is excitatory, Rose is inhibitory
        ctx.strokeStyle = weight > 0 
          ? `rgba(56, 189, 248, ${Math.min(1.0, Math.abs(weight) * 2.2)})` 
          : `rgba(244, 63, 94, ${Math.min(1.0, Math.abs(weight) * 2.2)})`;
        ctx.beginPath();
        ctx.moveTo(startX, inputY(i));
        ctx.lineTo(startX + layerSpacing, hiddenY(j));
        ctx.stroke();
      }
    }

    // 2. Draw synaptic lines Hidden -> Output
    for (let j = 0; j < hiddenCount; j++) {
      for (let k = 0; k < outputCount; k++) {
        const weight = pinn.weights2[j][k];
        ctx.strokeStyle = weight > 0 
          ? `rgba(56, 189, 248, ${Math.min(1.0, Math.abs(weight) * 2.2)})` 
          : `rgba(244, 63, 94, ${Math.min(1.0, Math.abs(weight) * 2.2)})`;
        ctx.beginPath();
        ctx.moveTo(startX + layerSpacing, hiddenY(j));
        ctx.lineTo(startX + layerSpacing * 2, outputY(k));
        ctx.stroke();
      }
    }

    // 3. Draw Nodes
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';

    // Input Nodes (x,y,z)
    for (let i = 0; i < inputCount; i++) {
      ctx.beginPath();
      ctx.arc(startX, inputY(i), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.stroke();
    }

    // Hidden nodes
    for (let j = 0; j < hiddenCount; j++) {
      ctx.beginPath();
      ctx.arc(startX + layerSpacing, hiddenY(j), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.8)';
      ctx.fill();
      ctx.stroke();
    }

    // Output nodes (px, py, pz)
    for (let k = 0; k < outputCount; k++) {
      ctx.beginPath();
      ctx.arc(startX + layerSpacing * 2, outputY(k), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.stroke();
    }

    // HUD Text labels
    ctx.font = '8px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PINN SOLVER MAP', startX - 5, startY - 12);
    ctx.fillText('IN (XYZ)', startX - 45, startY + 5);
    ctx.fillText('OUT (P_XYZ)', startX + layerSpacing * 2 + 8, startY + 5);
  };

  const applyWarpWormhole = () => {
    if (isWarping) return;
    setIsWarping(true);
    triggerHapticFeedback('Space-Time Bridge Insertion Thruster Active', 0.9);

    let counter = 0;
    const interval = setInterval(() => {
      counter += 5;
      setShipPos(prev => ({
        ...prev,
        z: prev.z - 20
      }));

      if (counter >= 100) {
        clearInterval(interval);
        setIsWarping(false);
        setActiveTab(prev => prev === 'blackhole' ? 'wormhole' : 'blackhole');
        setShipPos({ x: 0, y: 0, z: 220, px: 0.1, py: -0.1, pz: 0.05 });
        triggerHapticFeedback('Dimension Transition Succeeded', 0.85);
      }
    }, 40);
  };

  const resetShip = () => {
    setShipPos({ x: 0, y: 0, z: 220, px: 0.1, py: -0.1, pz: 0.05 });
    triggerHapticFeedback('Space-Time Coordinate System Reset', 0.3);
  };

  const steer = (dir: 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward') => {
    triggerHapticFeedback(`Thruster Impulse: ${dir}`, 0.45);
    setShipPos(prev => {
      switch (dir) {
        case 'up': return { ...prev, y: prev.y - 12 };
        case 'down': return { ...prev, y: prev.y + 12 };
        case 'left': return { ...prev, x: prev.x - 12 };
        case 'right': return { ...prev, x: prev.x + 12 };
        case 'forward': return { ...prev, z: Math.max(15, prev.z - 20) };
        case 'backward': return { ...prev, z: prev.z + 20 };
      }
    });
  };

  return (
    <div id="sim-engine-panel" className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 flex flex-col h-[400px] sm:h-[650px] relative overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-3">
          <Navigation2 className="text-sky-400 w-5 h-5 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 font-sans">
            6D SPACETIME & SINGULARITY VISUALIZER
          </h2>
        </div>

        <div className="flex bg-slate-900/90 rounded-lg p-0.5 border border-slate-800">
          <button
            id="tab-black-hole"
            onClick={() => {
              setActiveTab('blackhole');
              triggerHapticFeedback('Switched to Black Hole metrics', 0.2);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'blackhole'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Black Hole Singularity
          </button>
          <button
            id="tab-wormhole"
            onClick={() => {
              setActiveTab('wormhole');
              triggerHapticFeedback('Switched to Wormhole throat metrics', 0.2);
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeTab === 'wormhole'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Wormhole Throat
          </button>
        </div>
      </div>

      {/* Simulator canvas */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="flex-1 w-full bg-[#020205] rounded-lg border border-slate-900/60 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Gesture Visual Feedback HUD Overlay */}
        {gestureState.isActive && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-slate-950/90 border border-sky-500/30 rounded-full px-4 py-1.5 flex items-center gap-2 text-[9px] font-mono text-sky-400 backdrop-blur-sm shadow-lg pointer-events-none select-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
            <span className="font-bold uppercase tracking-wider">
              {gestureState.type === 'drag' && '🛰️ CAMERA COCKPIT: ORBIT ROTATION ACTIVE'}
              {gestureState.type === 'multi' && `🔍 SPYGLASS OPTICS: ZOOM ${(gestureState.zoomScale).toFixed(2)}x | ROTATION ${(gestureState.rotationDelta).toFixed(1)}°`}
            </span>
          </div>
        )}

        {/* Floating Controls HUD overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <button
            id="btn-toggle-play"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            id="btn-reset-ship"
            onClick={resetShip}
            className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            title="Reset Space Coordinates"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            id="btn-toggle-flux-map"
            onClick={() => {
              setShowFluxMap(!showFluxMap);
              triggerHapticFeedback(`Quantum 6D flux map overlay: ${!showFluxMap ? 'ENABLED' : 'DISABLED'}`, 0.5);
            }}
            className={`p-2 rounded-lg bg-slate-950/80 border text-slate-300 hover:text-white hover:bg-slate-900 transition-all ${
              showFluxMap ? 'border-sky-500 text-sky-400 bg-sky-950/50' : 'border-slate-800'
            }`}
            title="Toggle Quantum 6D Flux Map Overlay"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            id="btn-toggle-hud"
            onClick={() => {
              setIsHudExpanded(!isHudExpanded);
              triggerHapticFeedback(`HUD Cockpit controls: ${!isHudExpanded ? 'EXPANDED' : 'COLLAPSED'}`, 0.3);
            }}
            className={`p-2 rounded-lg bg-slate-950/80 border text-slate-300 hover:text-white hover:bg-slate-900 transition-all flex items-center gap-1.5 ${
              isHudExpanded ? 'border-amber-500 text-amber-400 bg-amber-950/40' : 'border-slate-800'
            }`}
            title="Toggle Cockpit Sliders Panel"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden sm:inline">
              COCKPIT HUD
            </span>
          </button>
        </div>

        {/* Collapsible HUD Parameters Stack */}
        {isHudExpanded && (
          <div className="absolute bottom-16 left-4 right-4 sm:right-auto sm:w-[340px] bg-slate-950/95 border border-slate-800 rounded-lg p-4 z-20 overflow-y-auto max-h-[60%] sm:max-h-[75%] backdrop-blur-md flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center border-b border-slate-900 pb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> 
                {activeTab === 'blackhole' ? 'SINGULARITY HUD METRICS' : 'ER-BRIDGE STABILIZATION HUD'}
              </span>
              <button 
                onClick={() => setIsHudExpanded(false)}
                className="text-slate-500 hover:text-slate-300 text-xs font-mono"
              >
                [CLOSE]
              </button>
            </div>

            {activeTab === 'blackhole' ? (
              <div className="flex flex-col gap-3.5 text-xs font-mono">
                {/* Metric Selector Buttons inside HUD */}
                <div>
                  <span className="text-[9px] text-slate-500 block mb-1">SINGULARITY GEOMETRY METRIC:</span>
                  <div className="grid grid-cols-3 bg-slate-900 rounded p-0.5 border border-slate-800/60">
                    {(['Schwarzschild', 'Kerr', 'Reissner-Nordstrom'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setBlackHole(prev => ({ ...prev, activeSingularity: m }));
                          triggerHapticFeedback(`Singularity metric changed: ${m}`, 0.4);
                        }}
                        className={`text-[8.5px] py-1 rounded text-center font-mono font-bold transition-all ${
                          blackHole.activeSingularity === m
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m.split('-')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mass with converted Unit directly */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Singularity Mass ($M$):</span>
                    <span className="text-amber-400 font-bold">{blackHole.mass.toFixed(1)} M_☉</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="0.5"
                    value={blackHole.mass}
                    onChange={(e) => {
                      setBlackHole(prev => ({ ...prev, mass: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                    <span>SCHWARZSCHILD RADIUS:</span>
                    <span className="text-amber-400">{(2.953 * blackHole.mass).toFixed(2)} km</span>
                  </div>
                </div>

                {blackHole.activeSingularity === 'Kerr' && (
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Ergosphere Spin ($a$):</span>
                      <span className="text-sky-400 font-bold">{(blackHole.spin * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={blackHole.spin}
                      onChange={(e) => {
                        setBlackHole(prev => ({ ...prev, spin: parseFloat(e.target.value) }));
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
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={blackHole.charge}
                      onChange={(e) => {
                        setBlackHole(prev => ({ ...prev, charge: parseFloat(e.target.value) }));
                      }}
                      className="w-full accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Light Lens Bending ($b_0$):</span>
                    <span className="text-emerald-400 font-bold">{blackHole.distortionScale.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={blackHole.distortionScale}
                    onChange={(e) => {
                      setBlackHole(prev => ({ ...prev, distortionScale: parseFloat(e.target.value) }));
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
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={blackHole.fractalLayers}
                    onChange={(e) => {
                      setBlackHole(prev => ({ ...prev, fractalLayers: parseInt(e.target.value) }));
                    }}
                    className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBlackHole({
                      mass: 14.8,
                      spin: 0.35,
                      charge: 0.0,
                      diskSpeed: 1.2,
                      distortionScale: 1.5,
                      fractalLayers: 5,
                      activeSingularity: 'Kerr'
                    });
                    triggerHapticFeedback('Singularity metrics reset', 0.5);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-amber-500 font-mono text-[9px] font-bold py-1.5 rounded border border-slate-800 transition-all text-center"
                >
                  RESET COCKPIT METRICS
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 text-xs font-mono">
                {/* Wormhole parameters inside HUD */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400">Resonance Stabilization Frequency:</span>
                    <span className="text-emerald-400 font-bold">{wormhole.stabilizerFreq.toFixed(1)} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="300"
                    step="0.5"
                    disabled={wormhole.autoStabilize}
                    value={wormhole.stabilizerFreq}
                    onChange={(e) => {
                      setWormhole(prev => ({ ...prev, stabilizerFreq: parseFloat(e.target.value) }));
                    }}
                    className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400">Exotic Negative Energy Density:</span>
                    <span className="text-purple-400 font-bold">{wormhole.negativeEnergy}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={wormhole.negativeEnergy}
                    onChange={(e) => {
                      setWormhole(prev => ({ ...prev, negativeEnergy: parseInt(e.target.value) }));
                    }}
                    className="w-full accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>Instability Index:</span>
                  <span className={metrics.instabilityFactor > 15 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {metrics.instabilityFactor.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-[10px] text-slate-400">Quantum Auto-Stabilizer Field:</span>
                  <input
                    type="checkbox"
                    checked={wormhole.autoStabilize}
                    onChange={(e) => {
                      setWormhole(prev => ({ ...prev, autoStabilize: e.target.checked }));
                      triggerHapticFeedback(`Auto stabilizer field: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 0.4);
                    }}
                    className="w-4 h-4 rounded border-slate-800 text-sky-500 accent-sky-400"
                  />
                </div>

                <button
                  disabled={wormhole.autoStabilize}
                  onClick={() => {
                    setWormhole(prev => ({ ...prev, stabilizerFreq: prev.targetFreq }));
                    triggerHapticFeedback('Auto-tuned stabilizer frequency', 0.5);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 py-1.5 rounded font-mono text-[10px] font-bold border border-slate-800 disabled:opacity-40 transition-all text-center"
                >
                  AUTO-RESOUND COCKPIT
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6D Quantum Particle Probability Density Flux Map (SVG Layer with D3.js) */}
        {showFluxMap && (
          <svg
            ref={d3SvgRef}
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
          >
            <defs>
              <radialGradient id="fluxGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="fluxFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
                <stop offset="50%" stopColor="rgba(168, 85, 247, 0.45)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0.15)" />
              </linearGradient>
            </defs>

            <g className="d3-orbits-group" />
            <g className="d3-vectors-group" />

            {/* Real-time Probability Density stats card */}
            <g transform="translate(15, 80)">
              <rect width="180" height="80" rx="4" fill="rgba(2, 2, 5, 0.88)" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
              <text x="10" y="15" fill="#38bdf8" fontSize="8px" fontFamily="monospace" fontWeight="bold">6D QUANTUM FLUX STATUS (D3.js)</text>
              <text x="10" y="28" fill="#94a3b8" fontSize="7.5px" fontFamily="monospace">• MASS WARP COEF: {(1 + blackHole.mass * 0.02).toFixed(3)}x</text>
              <text x="10" y="38" fill="#94a3b8" fontSize="7.5px" fontFamily="monospace">• CHARGE PERTURB: {(blackHole.charge * 0.12).toFixed(3)} rad</text>
              <text x="10" y="48" fill="#94a3b8" fontSize="7.5px" fontFamily="monospace">• STATE AMPLITUDE |Ψ|²: {(0.842 + blackHole.charge * 0.08).toFixed(3)} e/a₀³</text>
              <text x="10" y="58" fill="#94a3b8" fontSize="7.5px" fontFamily="monospace">• COHERENCE INTEGRAL: {(0.9984 - blackHole.mass * 0.0001).toFixed(4)}</text>
              <text x="10" y="68" fill="#c084fc" fontSize="7.5px" fontFamily="monospace">• 6D HAMILTONIAN MATRIX: RESOLVED</text>
            </g>
          </svg>
        )}

        {/* Neural Network dynamic optimizer details */}
        {isNNActive && activeTab === 'blackhole' && (
          <div className="absolute bottom-4 right-4 z-10 bg-slate-950/90 rounded-lg p-3 border border-slate-800 text-slate-300 flex flex-col gap-1 w-44 font-mono text-[9px]">
            <div className="text-emerald-400 font-bold flex items-center gap-1 border-b border-slate-800 pb-1 mb-1">
              <Cpu className="w-3.5 h-3.5 animate-spin" /> NEURAL PINN SOLVER
            </div>
            <div className="flex justify-between">
              <span>LOSS MSE:</span>
              <span className="text-rose-400 font-bold">{nnLoss.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span>EPOCH CODES:</span>
              <span className="text-sky-400 font-bold">{nnEpochs}</span>
            </div>
            <div className="flex justify-between">
              <span>SOLVER STATUS:</span>
              <span className="text-emerald-400 font-bold">OPTIMIZED</span>
            </div>
          </div>
        )}

        {/* Orbit rotation controls */}
        <div className="absolute top-4 right-4 z-10 bg-slate-950/80 rounded-lg p-2 border border-slate-800 text-slate-300 flex flex-col gap-1.5">
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Orbit className="w-3.5 h-3.5 text-sky-400" /> CAMERA ANGLE
            </div>
            <label className="flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => {
                  setAutoRotate(e.target.checked);
                  triggerHapticFeedback(`Auto 3D rotation: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 0.2);
                }}
                className="w-2.5 h-2.5 rounded border-slate-800 text-sky-500 accent-sky-400 bg-slate-950"
              />
              <span className="text-[7.5px] text-sky-400 font-bold tracking-wider">3D SPIN</span>
            </label>
          </div>
          <div className="flex gap-1.5 mt-1">
            <input
              id="slider-camera-theta"
              type="range"
              min="0"
              max="6.28"
              step="0.1"
              value={rotation.theta}
              onChange={(e) => {
                setRotation(prev => ({ ...prev, theta: parseFloat(e.target.value) }));
                if (autoRotate) setAutoRotate(false);
              }}
              className="w-16 accent-sky-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              title="Theta orbit"
            />
            <input
              id="slider-camera-phi"
              type="range"
              min="0.1"
              max="3.14"
              step="0.1"
              value={rotation.phi}
              onChange={(e) => {
                setRotation(prev => ({ ...prev, phi: parseFloat(e.target.value) }));
                if (autoRotate) setAutoRotate(false);
              }}
              className="w-16 accent-sky-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              title="Phi elevation"
            />
          </div>
        </div>

        {/* Real-time distance indicators */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-[10px] text-slate-300 font-mono flex flex-col gap-1">
          <div className="text-slate-500 font-sans font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400" /> DISTANCE telemetry
          </div>
          <div>Singularity: <span className="text-amber-400">{shipPos.z.toFixed(0)} km</span></div>
          <div>Horizon $r_s$: <span className="text-red-400">{metrics.schwarzschildRadius.toFixed(1)} km</span></div>
        </div>
      </div>

      {/* Neural Network Particle Optimizer configuration sidebar/panel */}
      {activeTab === 'blackhole' && (
        <div className="mt-3 bg-slate-950/60 rounded-lg p-3 border border-slate-900 text-slate-300 flex flex-col md:flex-row items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2">
            <Cpu className="text-purple-400 w-5 h-5 animate-pulse" />
            <div>
              <div className="text-[10px] font-bold text-slate-200">PHYSICS-INFORMED NEURAL NETWORK TRAJECTORY OPTIMIZER (PINN)</div>
              <div className="text-[9px] text-slate-400">Computes real-time Keplerian vector targets to prevent chaotic particle decay in intense gravity horizons.</div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-500">LEARNING RATE ($\eta$):</span>
              <input
                id="slider-nn-lr"
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={nnLearningRate}
                onChange={(e) => {
                  setNnLearningRate(parseFloat(e.target.value));
                  triggerHapticFeedback(`Neural learning rate adjusted to ${e.target.value}`, 0.25);
                }}
                className="w-20 accent-emerald-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-emerald-400">{nnLearningRate.toFixed(3)}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-500">GUIDE STRENGTH:</span>
              <input
                id="slider-nn-strength"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={nnOptimizationStrength}
                onChange={(e) => {
                  setNnOptimizationStrength(parseFloat(e.target.value));
                  triggerHapticFeedback(`Neural guide blending parameter set to ${e.target.value}`, 0.35);
                }}
                className="w-20 accent-purple-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-purple-400">{(nnOptimizationStrength * 100).toFixed(0)}%</span>
            </div>

            <button
              id="btn-toggle-nn"
              onClick={() => {
                setIsNNActive(!isNNActive);
                triggerHapticFeedback(`Neural network trajectory guidance: ${!isNNActive ? 'ENABLED' : 'DISABLED'}`, 0.6);
              }}
              className={`px-3 py-1 rounded text-[9px] font-mono transition-colors font-semibold border ${
                isNNActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {isNNActive ? 'PINN SOLVER: ACTIVE' : 'PINN SOLVER: OFF'}
            </button>
          </div>
        </div>
      )}

      {/* Deep Space Celestial Telemetry and Coordinate Selection panel */}
      {activeTab === 'wormhole' && (
        <div className="mt-3 bg-slate-950/60 rounded-lg p-3 border border-slate-900 text-slate-300 flex flex-col md:flex-row items-stretch justify-between gap-4 z-10">
          {/* Left info column */}
          <div className="flex-1 flex flex-col justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radar className="text-sky-400 w-5 h-5 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold text-slate-200">DEEP SPACE CELESTIAL TELEMETRY & COORDINATE SYSTEM</div>
                <div className="text-[9px] text-slate-400">Map the wormhole Einstein-Rosen bridge exit to real-world astrophysical coordinates. Match the resonance frequency to lock connection.</div>
              </div>
            </div>

            {/* Selector list */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
              {DEEP_SPACE_CATALOG.map((target) => {
                const isActive = selectedTarget.id === target.id;
                return (
                  <button
                    key={target.id}
                    id={`btn-celestial-${target.id}`}
                    onClick={() => {
                      setSelectedTarget(target);
                      triggerHapticFeedback(`Coordinate system aligned to ${target.name}`, 0.5);
                    }}
                    className={`p-1.5 rounded border text-[9px] text-left transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-semibold'
                        : 'bg-slate-950/40 text-slate-400 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="font-sans font-bold truncate">{target.name.split(' (')[0]}</div>
                    <div className="font-mono text-[8px] text-slate-500 mt-0.5">{target.distance}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right coordinate card */}
          <div className="w-full md:w-64 bg-slate-950/80 border border-slate-900 rounded p-2 flex flex-col justify-between gap-1 text-[9px] font-mono relative overflow-hidden">
            <div className="absolute right-2 top-2">
              <Compass className="w-4 h-4 text-sky-500/40 animate-spin" style={{ animationDuration: '20s' }} />
            </div>

            <div className="text-[8px] text-slate-500 uppercase font-sans font-bold">TARGET SIGNAL DECODER</div>
            <div className="text-[10px] font-sans font-bold text-sky-400 mt-1">{selectedTarget.name}</div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1.5 text-[8px] text-slate-400">
              <div>RIGHT ASCENSION:</div>
              <div className="text-slate-200 text-right">{selectedTarget.ra}</div>
              
              <div>DECLINATION:</div>
              <div className="text-slate-200 text-right">{selectedTarget.dec}</div>
              
              <div>CONSTELLATION:</div>
              <div className="text-slate-200 text-right">{selectedTarget.constellation}</div>
              
              <div>OBJECT TYPE:</div>
              <div className="text-slate-200 text-right">{selectedTarget.objectType}</div>

              <div>RESONANCE FREQ:</div>
              <div className="text-amber-400 text-right font-bold">{selectedTarget.resonanceFreq.toFixed(1)} Hz</div>
            </div>

            {/* Resonance Tuning Indicator */}
            <div className="mt-2 border-t border-slate-900 pt-1 flex items-center justify-between gap-1">
              <span className="text-[8px] text-slate-500 font-sans font-bold">TUNING:</span>
              <div className="flex-1 h-1.5 bg-slate-900 rounded relative overflow-hidden mx-1">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isTargetLocked ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: `${Math.max(5, 100 - Math.min(100, Math.abs(wormhole.stabilizerFreq - selectedTarget.resonanceFreq) * 20))}%` 
                  }}
                />
              </div>
              <span className={`text-[8px] font-bold ${isTargetLocked ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                {isTargetLocked ? 'COORDINATE LOCK' : 'DECOHERED'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation and Traversal panel */}
      <div className="mt-3 border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div>
          <div className="text-xs font-semibold text-slate-200">TRAVERSAL IMPULSE ENGINE</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Manually steer the vessel across the spacetime manifold or engage warp to enter the wormhole bridge.
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Thruster directions pad */}
          <div className="grid grid-cols-3 gap-1 w-28">
            <div />
            <button
              id="thruster-up"
              onClick={() => steer('up')}
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded"
            >
              ▲ UP
            </button>
            <div />
            <button
              id="thruster-left"
              onClick={() => steer('left')}
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded"
            >
              ◀ L
            </button>
            <button
              id="thruster-center-reset"
              onClick={resetShip}
              className="px-1 py-0.5 bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-500 hover:bg-slate-800 rounded"
              title="Reset coordinates"
            >
              RST
            </button>
            <button
              id="thruster-right"
              onClick={() => steer('right')}
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded"
            >
              R ▶
            </button>
            <div />
            <button
              id="thruster-down"
              onClick={() => steer('down')}
              className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded"
            >
              ▼ DN
            </button>
            <div />
          </div>

          {/* Depth thrust buttons */}
          <div className="flex flex-col gap-1">
            <button
              id="thruster-forward"
              onClick={() => steer('forward')}
              className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded flex items-center gap-1.5"
            >
              THRUST INWARD (Z-)
            </button>
            <button
              id="thruster-backward"
              onClick={() => steer('backward')}
              className="px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white rounded flex items-center gap-1.5"
            >
              THRUST OUTWARD (Z+)
            </button>
          </div>

          {/* Big Portal warp engage */}
          <button
            id="engage-warp-bridge"
            onClick={applyWarpWormhole}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider transition-all shadow-md flex items-center gap-2 ${
              activeTab === 'blackhole'
                ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-950/20'
                : 'bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white shadow-emerald-950/20'
            }`}
          >
            <Move3d className="w-4 h-4 animate-spin" />
            {activeTab === 'blackhole' ? 'WARP ER-BRIDGE' : 'EXIT WORMHOLE'}
          </button>
        </div>
      </div>
    </div>
  );
}
