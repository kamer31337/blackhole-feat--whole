export interface BlackHoleParams {
  mass: number; // in solar masses (e.g., 5 to 50)
  spin: number; // Kerr spin parameter a (0 to 1)
  charge: number; // Reissner-Nordström charge (0 to 1)
  diskSpeed: number; // accretion disk orbital velocity
  distortionScale: number; // coefficient of light bending
  fractalLayers: number; // number of fractal lattice layers/windows
  activeSingularity: 'Schwarzschild' | 'Kerr' | 'Reissner-Nordstrom';
}

export interface WormholeParams {
  throatRadius: number; // throat radius in km
  throatLength: number; // length of wormhole throat
  stabilizerFreq: number; // Hz (frequency to match resonance)
  targetFreq: number; // Resonance frequency (Hz)
  negativeEnergy: number; // energy density needed to keep open (percent)
  isStabilized: boolean;
  traversalProgress: number; // 0 to 100% traversal
  isTraversing: boolean;
}

export interface SchrodingerCatParams {
  decayRate: number; // radioactive decay probability per second
  catState: 'superposition' | 'alive' | 'dead';
  acousticProbeActive: boolean;
  heartbeatFrequency: number; // beat speed
  isMuted: boolean;
  boxOpened: boolean;
  soundMappingConfidence: number; // % certainty based on audio analysis
}

export interface SixDVector {
  // Spatial coordinates
  x: number;
  y: number;
  z: number;
  // Gravitational/Momentum quantum vectors
  px: number;
  py: number;
  pz: number;
}

export interface SimulationParticle {
  pos: SixDVector;
  color: string;
  size: number;
  alpha: number;
  speed: number;
  life: number;
  maxLife: number;
  type: 'disk' | 'lensed' | 'quantum' | 'wormhole-dust';
}

export interface TelemetryMetrics {
  timeDilation: number; // t_dil = sqrt(1 - rs/r)
  gravitationalRedshift: number; // z = 1 / sqrt(1 - rs/r) - 1
  singularityDistance: number; // r in km
  schwarzschildRadius: number; // rs in km
  lightDeflectionAngle: number; // in degrees
  instabilityFactor: number; // wormhole structural stability (0 - 100%)
  hapticLogs: Array<{
    id: string;
    timestamp: string;
    event: string;
    intensity: number;
    pattern?: 'pulse' | 'drift' | 'heavy tremor' | 'standard';
  }>;
  history: Array<{ time: number; instability: number; redshift: number }>;
}
