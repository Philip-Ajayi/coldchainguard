import React, { useState, useEffect } from 'react';
import {
  Shield,
  WifiOff,
  Play,
  Database,
  Stethoscope,
  Activity,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { BlinkSelector } from './components/BlinkSelector';
import { MultimeterInput } from './components/MultimeterInput';
import { NameplateScanner } from './components/NameplateScanner';
import { SchematicVisualizer } from './components/SchematicVisualizer';
import { DiagnosticReport } from './components/DiagnosticReport';
import { MemoryMonitor } from './components/MemoryMonitor';
import { MaintenanceLogModal } from './components/MaintenanceLogModal';
import { SyntheticDataModal } from './components/SyntheticDataModal';
import { DiagnosticPlan, SystemTelemetry, SyntheticBenchmarkCase } from './types';

export const App: React.FC = () => {
  const [selectedBlink, setSelectedBlink] = useState<number>(3);
  const [voltage, setVoltage] = useState<string>("12.1");
  const [resistance, setResistance] = useState<string>("2.1");
  const [fanAmperage, setFanAmperage] = useState<string>("0.35");
  const [ambientTemp, setAmbientTemp] = useState<string>("34");
  const [detectedModel, setDetectedModel] = useState<string>("BD35F");
  const [electronicUnit, setElectronicUnit] = useState<string>("101N0210");

  const [diagnosticPlan, setDiagnosticPlan] = useState<DiagnosticPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [telemetryError, setTelemetryError] = useState<boolean>(false);
  const [benchmarks, setBenchmarks] = useState<SyntheticBenchmarkCase[]>([]);

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isSyntheticModalOpen, setIsSyntheticModalOpen] = useState<boolean>(false);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/system-telemetry');
      if (!res.ok) throw new Error("Telemetry unreachable");
      const data = await res.json();
      setTelemetry(data);
      setTelemetryError(false);
    } catch {
      setTelemetry(null);
      setTelemetryError(true);
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const res = await fetch('/api/synthetic-benchmarks');
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks);
      }
    } catch {
      // Benchmark list non-critical
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchBenchmarks();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostic = async () => {
    setLoading(true);
    setApiError(null);
    setDiagnosticPlan(null);

    try {
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blinkCode: selectedBlink,
          voltage: parseFloat(voltage),
          resistance: resistance ? parseFloat(resistance) : undefined,
          fanAmperage: fanAmperage ? parseFloat(fanAmperage) : undefined,
          ambientTemp: ambientTemp ? parseFloat(ambientTemp) : undefined,
          compressorModel: detectedModel,
          electronicUnitCode: electronicUnit
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Diagnosis failed`);
      }

      setDiagnosticPlan(data.diagnostic);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
    } finally {
      setLoading(false);
      fetchTelemetry();
    }
  };

  const handleApplyBenchmark = (bm: SyntheticBenchmarkCase) => {
    setSelectedBlink(bm.blinkCode);
    setVoltage(bm.inputVoltage.toString());
    setResistance(bm.windingResistance.toString());
    setFanAmperage(bm.fanAmperage.toString());
    setAmbientTemp(bm.ambientTemp.toString());
    setDetectedModel(bm.compressorModel);
    setElectronicUnit(bm.electronicUnitCode);
    setDiagnosticPlan(null);
    setApiError(null);
  };

  return (
    <div className="min-h-screen bg-tactical-950 text-slate-100 flex flex-col font-sans">
      <header className="bg-tactical-900 border-b border-tactical-700/80 px-4 py-3 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-tactical-accent flex items-center justify-center text-tactical-950 font-black">
              <Stethoscope className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-extrabold tracking-wider text-white">ColdChainGuard</h1>
                <span className="text-[10px] font-mono bg-tactical-800 text-tactical-accent px-1.5 py-0.5 rounded border border-tactical-700 font-bold">
                  LIVE-EDGE
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Sovereign SDD Vaccine Refrigerator Diagnostic Co-Pilot
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsSyntheticModalOpen(true)}
              className="flex items-center space-x-1.5 bg-tactical-950 hover:bg-tactical-800 px-2.5 py-1 rounded border border-tactical-700 font-mono text-xs text-tactical-cyan transition"
            >
              <Database className="w-3.5 h-3.5 text-tactical-cyan" />
              <span>REFERENCE BENCHMARKS</span>
            </button>

            <div className={`hidden sm:flex items-center space-x-1.5 bg-tactical-950 px-2.5 py-1 rounded border font-mono text-xs ${telemetryError ? 'border-red-800 text-red-400' : 'border-tactical-700 text-emerald-400'}`}>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{telemetryError ? 'SERVER OFFLINE' : 'AIR-GAPPED'}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 bg-tactical-950 px-2.5 py-1 rounded border border-tactical-700 font-mono text-xs text-tactical-accent">
              <Shield className="w-3.5 h-3.5 text-tactical-accent" />
              <span>WHO PQS E003</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 flex-grow space-y-4">
        {apiError && (
          <div className="bg-red-950/80 border border-red-700 p-3.5 rounded-lg text-xs font-mono text-red-200 flex items-start justify-between">
            <div className="flex items-start space-x-2.5">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold">Diagnostic Inference Error:</strong>
                <span>{apiError}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-red-400 hover:text-white ml-2 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="bg-tactical-900/60 border border-tactical-800 rounded-lg p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-tactical-accent" />
            <span>LOAD GROUND-TRUTH TEST BENCH VALUES:</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setSelectedBlink(3);
                setVoltage("12.2");
                setResistance("4.8");
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 px-2.5 py-1 rounded text-red-400 transition"
            >
              Preset A: 3-Blink Rotor Burnout
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBlink(1);
                setVoltage("10.1");
                setResistance("2.1");
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 px-2.5 py-1 rounded text-amber-400 transition"
            >
              Preset B: 1-Blink Solar Sag
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBlink(2);
                setVoltage("12.4");
                setFanAmperage("0.72");
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 px-2.5 py-1 rounded text-cyan-400 transition"
            >
              Preset C: 2-Blink Seized Fan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <BlinkSelector selectedBlink={selectedBlink} onSelectBlink={(b) => { setSelectedBlink(b); setDiagnosticPlan(null); }} />

            <MultimeterInput
              voltage={voltage}
              resistance={resistance}
              fanAmperage={fanAmperage}
              ambientTemp={ambientTemp}
              onChange={(f, v) => {
                if (f === 'voltage') setVoltage(v);
                if (f === 'resistance') setResistance(v);
                if (f === 'fanAmperage') setFanAmperage(v);
                if (f === 'ambientTemp') setAmbientTemp(v);
                setDiagnosticPlan(null);
              }}
            />
          </div>

          <div className="lg:col-span-4 space-y-4">
            <NameplateScanner
              detectedModel={detectedModel}
              electronicUnit={electronicUnit}
              onModelChange={(m, u) => {
                setDetectedModel(m);
                setElectronicUnit(u);
              }}
            />

            <MemoryMonitor telemetry={telemetry} />

            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={loading}
              className="w-full bg-tactical-accent hover:bg-amber-600 disabled:opacity-50 active:scale-[0.98] text-black font-extrabold text-sm py-3.5 px-4 rounded-lg shadow-xl flex items-center justify-center space-x-2 uppercase tracking-wider transition"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{loading ? "Running Local Inference..." : "Run Diagnostic Isolation"}</span>
            </button>
          </div>
        </div>

        <SchematicVisualizer
          activePins={diagnosticPlan?.schematicFocusPins || ['+', '-', 'D']}
          blinkCode={selectedBlink}
        />

        <DiagnosticReport
          plan={diagnosticPlan}
          loading={loading}
          onOpenLogModal={() => setIsLogModalOpen(true)}
        />
      </main>

      <MaintenanceLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        plan={diagnosticPlan}
        blinkCode={selectedBlink}
        voltage={voltage}
        resistance={resistance}
        compressorModel={detectedModel}
      />

      <SyntheticDataModal
        isOpen={isSyntheticModalOpen}
        onClose={() => setIsSyntheticModalOpen(false)}
        benchmarks={benchmarks}
        onApplyBenchmark={handleApplyBenchmark}
      />

      <footer className="bg-tactical-900 border-t border-tactical-800 text-[11px] font-mono text-slate-500 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ColdChainGuard | Live Execution Mode</span>
          <span className="text-emerald-500">Autonomous Edge Node: Zero External Requests Permitted</span>
        </div>
      </footer>
    </div>
  );
};