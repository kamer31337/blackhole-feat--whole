import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup crashes when API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API for Intelligent Onboard Navigator (powered by Gemini)
app.post('/api/navigator/analyze', async (req, res) => {
  const { blackHole, wormhole, catState, metrics } = req.body;
  const generateFallback = () => {
    const isWormholeStable = wormhole.isStabilized;
    const cat = catState.catState;
    return `🚀 [COSMOS-6D Telemetry Advisory - Safe Fallback Mode]
Spacetime warping near the ${blackHole.activeSingularity} singularity of ${blackHole.mass} Solar Masses causes a proper coordinate time dilation of **${metrics.timeDilation.toFixed(3)}x** and **${metrics.lightDeflectionAngle.toFixed(1)}°** light bend.
${isWormholeStable ? "The Einstein-Rosen throat is currently stabilized." : `⚠️ **Wormhole Instability at ${metrics.instabilityFactor.toFixed(1)}%!** Calibrate the stabilizer to match the resonance frequency of **${wormhole.targetFreq} Hz**.`}
Schrödinger's acoustic container resolves to **${cat.toUpperCase()}** with **${catState.soundMappingConfidence}%** sonar confidence mapping accuracy.`;
  };

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        analysis: generateFallback()
      });
    }

    const prompt = `
You are the Onboard quantum navigator AI (designated "COSMOS-6D") of an advanced spacetime exploration vessel.
Analyze the following telemetry data and provide a highly detailed, scientific, immersive, and brief alert or commentary.

[TELEMETRY METRICS]
- Spacetime curvature: Distant = ${metrics.singularityDistance} km, Schwarzschild radius = ${metrics.schwarzschildRadius} km.
- Time Dilation factor: ${metrics.timeDilation}x slower near singularity.
- Light Bending Angle: ${metrics.lightDeflectionAngle}° deflection.
- Wormhole Stability: ${metrics.instabilityFactor}% Instability. Target stabilizer frequency: ${wormhole.targetFreq} Hz, Current frequency: ${wormhole.stabilizerFreq} Hz.
- Schrödinger's Cat Quantum State: ${catState.catState.toUpperCase()} (Acoustic probe: ${catState.acousticProbeActive ? 'ACTIVE' : 'INACTIVE'}, Conf: ${catState.soundMappingConfidence}%).

[BLACK HOLE CHARACTERISTICS]
- Mass: ${blackHole.mass} Solar Masses.
- Active metric model: ${blackHole.activeSingularity} (Spin: ${blackHole.spin}, Charge: ${blackHole.charge}).

Provide a 3-sentence diagnostic response in a strict scientific but cinematic space-vessel tone.
1. A brief status/warning about the black hole's gravitational lense and coordinate time dilation.
2. A direct advice regarding wormhole frequency tuning (resonance alignment).
3. A quantum diagnostic on the Schrödinger box's acoustic state leakage.
No markdown other than highlighting key values. Keep it under 100 words.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      analysis: response.text || generateFallback()
    });
  } catch (error: any) {
    console.log("[STATUS] Spacetime navigation utilizes local physics-based advisory engine fallback.");
    res.json({
      success: true,
      analysis: generateFallback()
    });
  }
});

// Endpoint for quantum stabilization suggestion
app.post('/api/navigator/stabilize', async (req, res) => {
  const { wormhole } = req.body;
  const generateFallbackSuggestion = () => {
    return `Harmonic optimizer indicates a frequency mismatch. Adjusting the stabilizer resonance parameters to exactly **${wormhole.targetFreq} Hz** to stabilize the Einstein-Rosen throat and reduce instability factors.`;
  };

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        suggestion: generateFallbackSuggestion()
      });
    }

    const prompt = `
The Einstein-Rosen bridge has a target resonance frequency of ${wormhole.targetFreq} Hz, but the stabilizer is set to ${wormhole.stabilizerFreq} Hz.
Provide a quick, technical calibration log (max 40 words) detailing what quantum stabilizer harmonics are triggered by this offset and how to correct it. Make it sound highly scientific.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      suggestion: response.text || generateFallbackSuggestion()
    });
  } catch (error: any) {
    console.log("[STATUS] Harmonic calibration utilizes local optimizer fallback.");
    res.json({
      success: true,
      suggestion: generateFallbackSuggestion()
    });
  }
});

// Serve Vite dev server or static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`6D Spacetime Server running on http://localhost:${PORT}`);
  });
}

startServer();
