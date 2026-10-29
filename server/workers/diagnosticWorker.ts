import path from 'path';
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

function synthesizeDiagnosticRule(input: SynthesisInput): DiagnosticPlan {
  const { blinkCode, voltage, resistance, contextChunks } = input;
  const citation = contextChunks[0]?.source || "WHO PQS E003 Specifications & Secop Diagnostic Manual";

  switch (blinkCode) {
    case 1: {
      const isExtremeLow = voltage < 9.6;
      return {
        status: isExtremeLow ? 'CRITICAL_HARDWARE_REPLACEMENT' : 'FAULT_ISOLATED',
        faultSummary: `Blink Code 1: Operational DC Input Undervoltage Sag (${voltage}V measured)`,
        rootCause: voltage < 10.4
          ? `Terminal voltage (${voltage}V) is below the electronic controller cut-out threshold (10.4V). Likely solar PV array calcification, high-impedance splice lines, or depleted direct drive buffer.`
          : `Transient DC voltage sag during motor startup inrush current. Line voltage drops below 9.6V under load.`,
        severity: 'HIGH',
        authorityCitation: citation,
        schematicFocusPins: ['+', '-', 'C'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Disconnect PV input isolator. Measure open-circuit voltage (Voc) across junction box terminals.",
            targetTerminals: ['PV+', 'PV-'],
            expectedValue: "> 17.0V DC under midday sunlight",
            failureCondition: "Voc < 14.0V indicates shaded cells, fractured glass, or blown bypass diodes",
            multimeterMode: 'DC_VOLTAGE'
          },
          {
            stepNumber: 2,
            instruction: "Measure DC voltage directly across electronic controller [+] and [-] pins during startup attempt.",
            targetTerminals: ['+', '-'],
            expectedValue: "Must remain strictly above 10.4V DC under compressor starting load",
            failureCondition: "Voltage collapses > 1.8V upon relay click: indicates high-resistance cable crimp",
            multimeterMode: 'DC_VOLTAGE'
          },
          {
            stepNumber: 3,
            instruction: "Inspect Terminal [C] resistor to confirm battery cut-out threshold calibration.",
            targetTerminals: ['C', '-'],
            expectedValue: "0 Ohms (Direct wire bridge for standard 10.4V cut-out / 11.7V cut-in)",
            failureCondition: "Open circuit or drifted resistor value causes premature false undervoltage trips",
            multimeterMode: 'RESISTANCE_OHMS'
          }
        ],
        preventiveAction: "Clean solar array surface, torque terminal screw connectors to 1.8 Nm, and verify 6.0 mm² AWG copper wire gauge."
      };
    }

    case 2: {
      return {
        status: 'FAULT_ISOLATED',
        faultSummary: `Blink Code 2: Condenser Cooling Fan Overcurrent Trip (> 0.5A)`,
        rootCause: "Electronic unit Terminal [F] trip. Fan motor stator coil is shorted or mechanical bearing is seized with desert dust.",
        severity: 'WARNING',
        authorityCitation: citation,
        schematicFocusPins: ['F', '+'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Power down refrigerator. Detach fan spade wire from Terminal [F].",
            targetTerminals: ['F'],
            expectedValue: "Terminal isolated; fan impeller spins freely by hand with zero resistance",
            failureCondition: "Impeller seized, friction drag, or blocked by foreign debris",
            multimeterMode: 'CONTINUITY'
          },
          {
            stepNumber: 2,
            instruction: "Measure DC coil resistance across the disconnected fan motor leads.",
            targetTerminals: ['Fan +', 'Fan -'],
            expectedValue: "28.0 to 45.0 Ohms (nominal 12V 0.3A brushless DC axial fan)",
            failureCondition: "Resistance < 24.0 Ohms indicates short-circuited turns; draws > 0.5A tripping controller",
            multimeterMode: 'RESISTANCE_OHMS'
          },
          {
            stepNumber: 3,
            instruction: "Power ON unit with fan lead detached. Verify compressor initiates refrigeration cycle.",
            targetTerminals: ['+', '-'],
            expectedValue: "Compressor runs smoothly without diagnostic LED blinks",
            failureCondition: "If controller still trips with fan disconnected, replace electronic controller 101N0210",
            multimeterMode: 'DC_VOLTAGE'
          }
        ],
        preventiveAction: "Replace defective fan with WHO-certified 12V ball-bearing fan. Clean condenser intake filter."
      };
    }

    case 3: {
      const windingResistance = resistance ?? 2.1;
      const isBurnedWinding = windingResistance < 1.4 || windingResistance > 3.0;

      return {
        status: isBurnedWinding ? 'CRITICAL_HARDWARE_REPLACEMENT' : 'FAULT_ISOLATED',
        faultSummary: `Blink Code 3: Motor Start Failure / Rotor Lock`,
        rootCause: isBurnedWinding
          ? `Compressor 3-phase stator winding fault. Measured resistance (${windingResistance} Ohms) is outside WHO tolerance.`
          : `Mechanical rotor lock or differential refrigerant pressure > 5.0 bar preventing starting torque.`,
        severity: 'CRITICAL_SPOILAGE_RISK',
        authorityCitation: citation,
        schematicFocusPins: ['1', '2', '3', 'P'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Power down system. Wait 10 minutes to allow high and low pressure refrigerant sides to equalize.",
            targetTerminals: ['+', '-'],
            expectedValue: "Differential pressure equalized below 3.0 bar",
            failureCondition: "Frequent short-cycling without delay keeps back-pressure too high for motor starting torque",
            multimeterMode: 'DC_VOLTAGE'
          },
          {
            stepNumber: 2,
            instruction: "Unclip electronic unit from compressor body. Expose the three internal feedthrough pins.",
            targetTerminals: ['Pin 1 (Top)', 'Pin 2 (Bottom-L)', 'Pin 3 (Bottom-R)'],
            expectedValue: "2.1 Ohms (±0.3 Ohm) balanced across all 3 pin combinations at 20°C ambient",
            failureCondition: "Infinite resistance (open circuit) or < 1.0 Ohm (dead short) confirms internal stator burnout",
            multimeterMode: 'RESISTANCE_OHMS'
          },
          {
            stepNumber: 3,
            instruction: "Test insulation resistance from each pin to the copper suction line ground pipe.",
            targetTerminals: ['Pin 1', 'Chassis Ground'],
            expectedValue: "Open circuit / Mega-Ohms (> 10 MΩ)",
            failureCondition: "Continuity or resistance < 1 MΩ indicates motor winding shorted to ground",
            multimeterMode: 'RESISTANCE_OHMS'
          }
        ],
        preventiveAction: isBurnedWinding
          ? "CRITICAL: Replace compressor assembly (Secop BD35F). Evacuate system, replace filter-drier, recharge with 42g R134a."
          : "Verify thermostat differential delay timer. Do not bypass the 5-minute anti-short-cycling safety window."
      };
    }

    case 4: {
      return {
        status: 'FAULT_ISOLATED',
        faultSummary: `Blink Code 4: Minimum Motor Speed Loss (< 1,850 RPM)`,
        rootCause: "Compressor motor unable to maintain minimum operational velocity under current thermal / pressure envelope.",
        severity: 'HIGH',
        authorityCitation: citation,
        schematicFocusPins: ['C', 'T'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Check calibration resistor bridged across Terminal [C] and Terminal [T].",
            targetTerminals: ['C', 'T'],
            expectedValue: "0 Ohms (for default 2,000 RPM) or 277 Ohms (for 2,500 RPM)",
            failureCondition: "High resistance (> 1.5 kΩ) due to dirt/water bridge forces controller below 1,850 RPM cutoff",
            multimeterMode: 'RESISTANCE_OHMS'
          },
          {
            stepNumber: 2,
            instruction: "Verify controller heatsink mounting screws. Ensure firm thermal coupling to compressor casing.",
            targetTerminals: ['Electronic Unit Chassis'],
            expectedValue: "Firm physical contact with intact thermal paste layer",
            failureCondition: "Loose controller heatsink causes PWM MOSFET power limiting",
            multimeterMode: 'CONTINUITY'
          }
        ],
        preventiveAction: "Clean terminals [C] and [T] with isopropyl alcohol. Ensure tight wire terminal crimping."
      };
    }

    case 5: {
      return {
        status: 'FAULT_ISOLATED',
        faultSummary: `Blink Code 5: Controller Inverter Thermal Overheat (> 85°C)`,
        rootCause: `Controller electronics temperature exceeded safe threshold (85°C). Detected cabinet ambient: ${input.ambientTemp || 38}°C.`,
        severity: 'HIGH',
        authorityCitation: citation,
        schematicFocusPins: ['+', '-', 'F'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Measure ambient temperature inside the lower refrigerator compressor cabinet enclosure.",
            targetTerminals: ['Cabinet Ventilation'],
            expectedValue: "< 43.0°C under full WHO Class T tropical rating",
            failureCondition: "Cabinet temp > 50.0°C indicates blocked ventilation louvers or dust-choked airflow",
            multimeterMode: 'DC_VOLTAGE'
          },
          {
            stepNumber: 2,
            instruction: "Verify condenser fan is blowing air across both condenser coil and electronic controller.",
            targetTerminals: ['F', '+'],
            expectedValue: "Airflow oriented directly onto inverter backplate heat spreader",
            failureCondition: "Fan blowing reversed or blocked by dust blanket",
            multimeterMode: 'DC_VOLTAGE'
          }
        ],
        preventiveAction: "Reposition refrigerator at least 15 cm away from clinic walls. Vacuum condenser matrix."
      };
    }

    default: {
      return {
        status: 'REQUIRES_FURTHER_TELEMETRY',
        faultSummary: "Normal Operation or Unrecognized Blink Pattern",
        rootCause: "No active electronic unit blink error code signaled. Unit should be in continuous cooling state.",
        severity: 'WARNING',
        authorityCitation: citation,
        schematicFocusPins: ['+', '-', 'D'],
        recommendedSteps: [
          {
            stepNumber: 1,
            instruction: "Check continuity across mechanical thermostat terminals.",
            targetTerminals: ['C', 'T'],
            expectedValue: "0.0 Ohms (Closed circuit requesting cooling)",
            failureCondition: "Open circuit indicates thermostat dial is OFF or thermostat probe capillary tube is ruptured",
            multimeterMode: 'CONTINUITY'
          }
        ],
        preventiveAction: "Verify vaccine cold compartment temperature stays within +2.0°C to +8.0°C."
      };
    }
  }
}

async function runSynthesisWithQVAC(input: SynthesisInput): Promise<DiagnosticPlan> {
  try {
    const qvac = await import('@qvac/sdk');
    const modelPath = path.resolve(process.cwd(), 'models', 'qwen2.5-1.5b-instruct-q4_k_m.gguf');

    const modelId = await qvac.loadModel({
      modelType: 'llamacpp-completion',
      modelSrc: modelPath,
      modelConfig: {
        ctx_size: 1024,
        threads: 3
      }
    });

    const contextText = input.contextChunks.map(c => `${c.title}:\n${c.content}`).join('\n\n');
    const systemPrompt = `You are ColdChainGuard, an air-gapped diagnostic co-pilot for WHO PQS vaccine refrigerators. 
You must strictly synthesize instructions using ONLY the provided manual context. Never extrapolate or hallucinate.
Output pure JSON matching this exact structure:
{
  "status": "FAULT_ISOLATED",
  "faultSummary": "<summary>",
  "rootCause": "<root-cause>",
  "severity": "HIGH",
  "authorityCitation": "${input.contextChunks[0]?.source || 'WHO PQS E003'}",
  "schematicFocusPins": ["+", "-", "D"],
  "recommendedSteps": [
    {
      "stepNumber": 1,
      "instruction": "<exact multimeter action>",
      "targetTerminals": ["<terminals>"],
      "expectedValue": "<value>",
      "failureCondition": "<condition>",
      "multimeterMode": "DC_VOLTAGE"
    }
  ],
  "preventiveAction": "<action>"
}`;

    const userPrompt = `Context:\n${contextText}\n\nEquipment: ${input.compressorModel} (${input.electronicUnitCode})\nLED Blinks: ${input.blinkCode}\nDC Voltage: ${input.voltage}V\nStator Resistance: ${input.resistance ?? 'N/A'} Ohms\nGenerate electrical isolation sequence:`;

    const response = qvac.completion({
      modelId,
      history: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      generationParams: {
        temp: 0.05
      }
    });

    const rawText = await response.text;
    await qvac.unloadModel({ modelId });

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback to deterministic rule engine
  }

  return synthesizeDiagnosticRule(input);
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