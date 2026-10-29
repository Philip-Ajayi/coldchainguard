export interface DiagnosticStep {
  stepNumber: number;
  instruction: string;
  targetTerminals: string[];
  expectedValue: string;
  failureCondition: string;
  multimeterMode: 'DC_VOLTAGE' | 'RESISTANCE_OHMS' | 'CONTINUITY' | 'DC_CURRENT';
}

export interface DiagnosticPlan {
  status: 'FAULT_ISOLATED' | 'REQUIRES_FURTHER_TELEMETRY' | 'CRITICAL_HARDWARE_REPLACEMENT';
  faultSummary: string;
  rootCause: string;
  severity: 'WARNING' | 'HIGH' | 'CRITICAL_SPOILAGE_RISK';
  authorityCitation: string;
  recommendedSteps: DiagnosticStep[];
  schematicFocusPins: string[];
  preventiveAction: string;
}

export interface SystemTelemetry {
  status: string;
  mode: string;
  hostMemory: {
    rssMb: number;
    heapTotalMb: number;
    heapUsedMb: number;
    externalMb: number;
    totalSystemUsedApproxMb: number;
    systemCeilingMb: number;
  };
  recentWorkerRuns: Array<{
    id: number;
    worker_name: string;
    peak_memory_mb: number;
    duration_ms: number;
    exit_code: number;
    timestamp: string;
  }>;
}

export interface SyntheticBenchmarkCase {
  id: string;
  name: string;
  description: string;
  compressorModel: string;
  electronicUnitCode: string;
  blinkCode: number;
  inputVoltage: number;
  windingResistance: number;
  fanAmperage: number;
  ambientTemp: number;
  expectedRootCause: string;
}
