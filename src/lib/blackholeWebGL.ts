/**
 * Advanced High-Performance WebGL Helper
 * Renders the Interstellar-style fluid viscous accretion disk
 * with continuous flow fields and vertex-shader gravitational wave ripples.
 */

export class BlackHoleWebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;

  // Shader Uniform Locations
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uMassLoc: WebGLUniformLocation | null = null;
  private uSpinLoc: WebGLUniformLocation | null = null;
  private uChargeLoc: WebGLUniformLocation | null = null;
  private uInstabilityLoc: WebGLUniformLocation | null = null;
  private uRippleTriggerLoc: WebGLUniformLocation | null = null;
  private uFractalLayersLoc: WebGLUniformLocation | null = null;
  private uRotationLoc: WebGLUniformLocation | null = null;

  private isInitialized = false;
  private gridResolution = 45; // grid resolution for vertex displacement
  private indexCount = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;
    this.initGL();
  }

  public isSupported(): boolean {
    return this.gl !== null;
  }

  public getGL(): WebGLRenderingContext | null {
    return this.gl;
  }

  private initGL() {
    try {
      this.gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
      if (!this.gl) {
        this.gl = this.canvas.getContext('experimental-webgl', { alpha: true }) as WebGLRenderingContext;
      }
      if (!this.gl) {
        console.warn('WebGL not supported by environment. Falling back to procedural 2D Canvas fallback.');
        return;
      }

      const gl = this.gl;

      // Vertex shader containing gravitational wave 3D ripples
      const vsSource = `
        attribute vec3 aPosition;
        attribute vec2 aUv;
        varying vec2 vUv;
        varying float vDisplacement;
        uniform float uTime;
        uniform float uMass;
        uniform float uSpin;
        uniform float uRippleTrigger;

        void main() {
          vUv = aUv;
          
          // Distance from center of the space grid (0.5, 0.5)
          vec2 dVec = aUv - vec2(0.5);
          float dist = length(dVec);
          
          // Simulate gravitational waves propagation as concentric ripples
          float wave = sin(dist * 35.0 - uTime * 14.0) * exp(-dist * 3.5);
          
          // Modulate ripple amplitude based on parameter adjustment trigger and mass/spin
          float rippleAmplitude = uRippleTrigger * 0.16 * (uMass / 12.0 + uSpin * 0.5 + 0.5);
          float displacement = wave * rippleAmplitude;
          
          vDisplacement = displacement;
          
          // Displace vertex coordinate along Z axis
          vec3 displacedPos = aPosition;
          displacedPos.z += displacement;
          
          gl_Position = vec4(displacedPos, 1.0);
        }
      `;

      // Fragment shader simulating viscous fluid stretching and double-ring gravitational lensing
      const fsSource = `
        precision highp float;
        varying vec2 vUv;
        varying float vDisplacement;
        uniform float uTime;
        uniform float uMass;
        uniform float uSpin;
        uniform float uCharge;
        uniform float uInstability;
        uniform float uFractalLayers;
        uniform float uRotation;

        // Pseudo-random noise functions for continuous fluid simulation
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = rot * p * 2.1 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // Relativistic warp of UV coordinate coordinates based on vertex shader displacement ripples
          vec2 uv = vUv - vec2(0.5);
          
          // Apply rotation
          float c = cos(uRotation);
          float s = sin(uRotation);
          uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

          uv += uv * (vDisplacement * 0.22);
          
          float dist = length(uv);
          
          // Dynamic Schwarzschild radius boundary
          float rs = 0.08 + (uMass / 50.0) * 0.06;
          
          // Shadow zone (Event Horizon)
          if (dist < rs) {
            float edgeGlow = smoothstep(rs * 0.9, rs, dist);
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0 - edgeGlow * 0.8);
            return;
          }
          
          // Fractal Lattice
          float lattice = 0.0;
          if (uFractalLayers > 0.0) {
              vec2 gridUv = uv * (uFractalLayers * 2.0 + 2.0); 
              vec2 id = floor(gridUv);
              vec2 g = fract(gridUv);
              
              // "Windows" effect (centered in each grid cell)
              float window = smoothstep(0.4, 0.5, abs(g.x - 0.5)) * smoothstep(0.4, 0.5, abs(g.y - 0.5));
              
              // Time-based animation for layers
              float layerPhase = uTime * 0.5 + length(id) * 0.1;
              lattice = window * (0.5 + 0.5 * sin(layerPhase));
          }

          // Keplerian differential rotational flow coordinates
          float phi = atan(uv.y, uv.x);
          float speedShear = 1.6 + uSpin * 1.8;
          
          // Inner regions rotate much faster than outer regions (fluid velocity shear)
          float rotation = phi - (uTime * speedShear / pow(dist, 0.8));
          
          // Create continuous gaseous flowing structures
          vec2 flowCoords = vec2(dist * 16.0 - uTime * 0.5, rotation * 3.8);
          float fluidNoise = fbm(flowCoords);
          
          // Viscous fluid stretching effect: apply second FBM noise warped by first noise
          vec2 stretchCoords = vec2(dist * 22.0, rotation * 5.0 + fluidNoise * 1.5);
          float flowIntensity = fbm(stretchCoords);
          
          // Einstein Gravitational Lensing simulation of double ring (primary + secondary)
          float primaryRing = exp(-pow(dist - rs * 2.4, 2.0) / (rs * rs * 1.4));
          float secondaryRing = exp(-pow(dist - rs * 1.4, 2.0) / (rs * rs * 0.12)) * 0.52;
          float lensingIntensity = primaryRing + secondaryRing;
          
          // Combine fluid turbulence with gravity intensity profile
          float diskGlow = lensingIntensity * (0.35 + 0.65 * flowIntensity);
          
          // Relativistic thermal red-shifting:
          // Center is white-hot, mid is vibrant orange-gold, edges are blood-red
          vec3 hotCore = vec3(1.0, 0.98, 0.92);
          vec3 midFlame = vec3(0.99, 0.52, 0.06);
          vec3 outerDecay = vec3(0.82, 0.14, 0.02);
          
          float t = (dist - rs) / (rs * 3.8);
          vec3 color = mix(hotCore, midFlame, clamp(t * 1.4, 0.0, 1.0));
          color = mix(color, outerDecay, clamp((t - 0.45) * 1.6, 0.0, 1.0));
          
          // Instability flicker modeling
          float flicker = 1.0 + sin(uTime * 18.0) * (uInstability * 0.16);
          float alpha = diskGlow * flicker;
          
          // Add fractal lattice
          if (lattice > 0.5) {
              alpha += 0.3;
              color = vec3(0.5, 0.8, 1.0);
          }
          
          // High-energy particle discharge overlay
          if (alpha > 0.02) {
            gl_FragColor = vec4(color * diskGlow * 1.55, alpha);
          } else {
            gl_FragColor = vec4(0.0);
          }
        }
      `;

      // Compile Shaders
      const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return;

      this.program = gl.createProgram();
      if (!this.program) return;

      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.error('Shader linking failed:', gl.getProgramInfoLog(this.program));
        return;
      }

      gl.useProgram(this.program);

      // Map attributes
      const posAttr = gl.getAttribLocation(this.program, 'aPosition');
      const uvAttr = gl.getAttribLocation(this.program, 'aUv');

      // Map uniforms
      this.uTimeLoc = gl.getUniformLocation(this.program, 'uTime');
      this.uMassLoc = gl.getUniformLocation(this.program, 'uMass');
      this.uSpinLoc = gl.getUniformLocation(this.program, 'uSpin');
      this.uChargeLoc = gl.getUniformLocation(this.program, 'uCharge');
      this.uInstabilityLoc = gl.getUniformLocation(this.program, 'uInstability');
      this.uRippleTriggerLoc = gl.getUniformLocation(this.program, 'uRippleTrigger');
      this.uFractalLayersLoc = gl.getUniformLocation(this.program, 'uFractalLayers');
      this.uRotationLoc = gl.getUniformLocation(this.program, 'uRotation');

      // Generate the vertex mesh grid
      this.buildGrid(gl, posAttr, uvAttr);

      this.isInitialized = true;
    } catch (e) {
      console.warn('WebGL initialization failed, bypassing to 2D engine:', e);
    }
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const s = this.gl.createShader(type);
    if (!s) return null;
    this.gl.shaderSource(s, source);
    this.gl.compileShader(s);
    if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(s));
      this.gl.deleteShader(s);
      return null;
    }
    return s;
  }

  private buildGrid(gl: WebGLRenderingContext, posAttr: number, uvAttr: number) {
    const res = this.gridResolution;
    const vertices: number[] = [];
    const indices: number[] = [];

    // Generate grid points
    for (let r = 0; r <= res; r++) {
      const y = (r / res) * 2 - 1; // range -1 to 1
      const v = r / res;
      for (let c = 0; c <= res; c++) {
        const x = (c / res) * 2 - 1; // range -1 to 1
        const u = c / res;

        // Position: X, Y, Z (initially 0)
        vertices.push(x, y, 0);
        // UV coordinate coordinates
        vertices.push(u, v);
      }
    }

    // Generate indices for triangle strip or triangles
    for (let r = 0; r < res; r++) {
      for (let c = 0; c < res; c++) {
        const i0 = r * (res + 1) + c;
        const i1 = i0 + 1;
        const i2 = (r + 1) * (res + 1) + c;
        const i3 = i2 + 1;

        // Triangle 1
        indices.push(i0, i1, i2);
        // Triangle 2
        indices.push(i1, i3, i2);
      }
    }

    this.indexCount = indices.length;

    // Create and bind buffers
    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Set attributes format
    const FSIZE = Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(posAttr, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(posAttr);

    gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(uvAttr);
  }

  /**
   * Performs WebGL drawing cycle to the offscreen canvas
   */
  public draw(params: {
    time: number;
    mass: number;
    spin: number;
    charge: number;
    instability: number;
    rippleTrigger: number;
    fractalLayers: number;
    rotation: number;
  }): HTMLCanvasElement | null {
    if (!this.isInitialized || !this.gl || !this.program) {
      return null;
    }

    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.program);

    // Bind uniforms
    if (this.uTimeLoc) gl.uniform1f(this.uTimeLoc, params.time);
    if (this.uMassLoc) gl.uniform1f(this.uMassLoc, params.mass);
    if (this.uSpinLoc) gl.uniform1f(this.uSpinLoc, params.spin);
    if (this.uChargeLoc) gl.uniform1f(this.uChargeLoc, params.charge);
    if (this.uInstabilityLoc) gl.uniform1f(this.uInstabilityLoc, params.instability);
    if (this.uRippleTriggerLoc) gl.uniform1f(this.uRippleTriggerLoc, params.rippleTrigger);
    if (this.uFractalLayersLoc) gl.uniform1f(this.uFractalLayersLoc, params.fractalLayers);
    if (this.uRotationLoc) gl.uniform1f(this.uRotationLoc, params.rotation);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

    // Render mesh
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

    return this.canvas;
  }

  public setSize(w: number, h: number) {
    const size = Math.max(256, Math.min(1024, Math.floor(Math.max(w, h))));
    if (this.canvas.width !== size) {
      this.canvas.width = size;
      this.canvas.height = size;
    }
  }
}
