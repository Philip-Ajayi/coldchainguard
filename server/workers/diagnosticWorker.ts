import path from 'path';
import fs from 'fs';
import { WHOManualChunk } from '../seedData.js';

interface SynthesisInput {
  blinkCode: number;
  voltage: number;
  fanAmperage?: number;
  resistance?: number;
  ambientTemp?: number;
  compressorModel: string;
  electronicUnitCode: string;
  contextChunks: WHOManualChunk[];
}

interface DiagnosticStep {
  stepNumber: number;
  instruction: string;
  targetTerminals: string[];
  expectedValue: string;
  failureCondition: string;
  multimeterMode: 'DC_VOLTAGE' | 'RESISTANCE_OHMS' | 'CONTINUITY' | 'DC_CURRENT';
}

interface DiagnosticPlan {
  status: 'FAULT_ISOLATED' | 'REQUIRES_FURTHER_TELEMETRY' | 'CRITICAL_HARDWARE_REPLACEMENT';
  faultSummary: string;
  rootCause: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL_SPOILAGE_RISK';
  authorityCitation: string;
  recommendedSteps: DiagnosticStep[];
  schematicFocusPins: string[];
  preventiveAction: string;
}

async function runSynthesisWithQVAC(input: SynthesisInput): Promise<DiagnosticPlan> {
  const modelPath = path.resolve(process.cwd(), 'models', 'qwen2.5-1.5b-instruct-q4_k_m.gguf');
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Diagnostic LLM model not found at ${modelPath}. Place 'qwen2.5-1.5b-instruct-q4_k_m.gguf' in the models/ directory.`);
  }

  if (!input.contextChunks || input.contextChunks.length === 0) {
    throw new Error("Diagnostic Synthesis Error: Empty reference context chunks provided to synthesizer.");
  }

  const qvac = await import('@qvac/sdk');

  const modelId = await qvac.loadModel({
    modelType: 'llamacpp-completion',
    modelSrc: modelPath,
    modelConfig: {
      ctx_size: 2048,
      threads: 3
    }
  });

  try {
    const contextText = input.contextChunks.map(c => `[Source: ${c.source}]\n${c.title}:\n${c.content}`).join('\n\n');
    const systemPrompt = `You are ColdChainGuard, an air-gapped diagnostic co-pilot for WHO PQS vaccine refrigerators.
Synthesize actionable electrical troubleshooting steps using ONLY the provided verified manual context.
You must output exclusively valid JSON conforming to this schema without additional prose:
{
  "status": "FAULT_ISOLATED" | "REQUIRES_FURTHER_TELEMETRY" | "CRITICAL_HARDWARE_REPLACEMENT",
  "faultSummary": "string",
  "rootCause": "string",
  "severity": "WARNING" | "HIGH" | "CRITICAL_SPOILAGE_RISK",
  "authorityCitation": "string",
  "schematicFocusPins": ["pin1", "pin2"],
  "recommendedSteps": [
    {
      "stepNumber": 1,
      "instruction": "string",
      "targetTerminals": ["string"],
      "expectedValue": "string",
      "failureCondition": "string",
      "multimeterMode": "DC_VOLTAGE" | "RESISTANCE_OHMS" | "CONTINUITY" | "DC_CURRENT"
    }
  ],
  "preventiveAction": "string"
}`;

    const userPrompt = `Context:\n${contextText}\n\nEquipment:\nCompressor: ${input.compressorModel}\nElectronic Unit: ${input.electronicUnitCode}\nDiagnostic Blinks: ${input.blinkCode}\nMultimeter Measured DC Voltage: ${input.voltage}V\nStator Phase Resistance: ${input.resistance !== undefined ? `${input.resistance} Ω` : 'Not Measured'}\nFan Current: ${input.fanAmperage !== undefined ? `${input.fanAmperage} A` : 'Not Measured'}\nAmbient Temperature: ${input.ambientTemp !== undefined ? `${input.ambientTemp} °C` : 'Not Measured'}\n\nGenerate the electrical isolation plan:`;

    const response = qvac.completion({
      modelId,
      history: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      stream: false,
      generationParams: {
        temp: 0.05
      }
    });

    const rawText = await response.text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Diagnostic LLM failed to produce valid JSON output. Output was:\n${rawText.slice(0, 300)}`);
    }

    const parsed: DiagnosticPlan = JSON.parse(jsonMatch[0]);

    if (!parsed.status || !parsed.faultSummary || !parsed.recommendedSteps || !Array.isArray(parsed.recommendedSteps)) {
      throw new Error("Synthesized plan missing required structural fields.");
    }

    return parsed;
  } finally {
    await qvac.unloadModel({ modelId });
  }
}

process.on('message', async (input: SynthesisInput) => {
  try {
    const diagnostic = await runSynthesisWithQVAC(input);
    if (process.send) {
      process.send({ success: true, diagnostic });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (process.send) {
      process.send({ success: false, error: errorMsg });
    }
  } finally {
    process.exit(0);
  }
});