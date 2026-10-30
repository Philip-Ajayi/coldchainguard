import React, { useState, useEffect } from 'react';
import {
  Shield,
  WifiOff,
  Play,
  Database,
  Stethoscope,
  Activity,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Thermometer,
  Zap,
  ShieldCheck,
} from 'lucide-react';

import { BlinkSelector } from './components/BlinkSelector';
import { MultimeterInput } from './components/MultimeterInput';
import { NameplateScanner } from './components/NameplateScanner';
import { SchematicVisualizer } from './components/SchematicVisualizer';
import { DiagnosticReport } from './components/DiagnosticReport';
import { MemoryMonitor } from './components/MemoryMonitor';
import { MaintenanceLogModal } from './components/MaintenanceLogModal';
import { SyntheticDataModal } from './components/SyntheticDataModal';

import {
  DiagnosticPlan,
  SystemTelemetry,
  SyntheticBenchmarkCase,
} from './types';

export const App: React.FC = () => {
  const [selectedBlink, setSelectedBlink] = useState<number>(3);
  const [voltage, setVoltage] = useState<string>('12.1');
  const [resistance, setResistance] = useState<string>('2.1');
  const [fanAmperage, setFanAmperage] = useState<string>('0.35');
  const [ambientTemp, setAmbientTemp] = useState<string>('34');
  const [detectedModel, setDetectedModel] = useState<string>('BD35F');
  const [electronicUnit, setElectronicUnit] = useState<string>('101N0210');

  const [diagnosticPlan, setDiagnosticPlan] =
    useState<DiagnosticPlan | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [telemetry, setTelemetry] =
    useState<SystemTelemetry | null>(null);

  const [telemetryError, setTelemetryError] =
    useState<boolean>(false);

  const [benchmarks, setBenchmarks] =
    useState<SyntheticBenchmarkCase[]>([]);

  const [isLogModalOpen, setIsLogModalOpen] =
    useState<boolean>(false);

  const [isSyntheticModalOpen, setIsSyntheticModalOpen] =
    useState<boolean>(false);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/system-telemetry');

      if (!res.ok) {
        throw new Error('Telemetry unreachable');
      }

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
          resistance: resistance
            ? parseFloat(resistance)
            : undefined,
          fanAmperage: fanAmperage
            ? parseFloat(fanAmperage)
            : undefined,
          ambientTemp: ambientTemp
            ? parseFloat(ambientTemp)
            : undefined,
          compressorModel: detectedModel,
          electronicUnitCode: electronicUnit,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          `HTTP ${response.status}: Diagnosis failed`
        );
      }

      setDiagnosticPlan(data.diagnostic);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : String(err);

      setApiError(msg);
    } finally {
      setLoading(false);
      fetchTelemetry();
    }
  };

  const handleApplyBenchmark = (
    bm: SyntheticBenchmarkCase
  ) => {
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

  const clearDiagnosis = () => {
    setDiagnosticPlan(null);
    setApiError(null);
  };

  return (
    <div className="app-shell flex flex-col">

      {/* HEADER */}

      <header className="app-header">
        <div className="header-inner">

          <div className="flex items-center gap-3 min-w-0">
            <div className="brand-mark">
              <Stethoscope size={23} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="brand-name">
                  ColdChainGuard
                </h1>

                <span className="text-[9px] font-bold tracking-wider text-[#42c9ad] bg-[#173b43] px-2 py-1 rounded-md">
                  LIVE EDGE
                </span>
              </div>

              <p className="brand-caption">
                Vaccine refrigerator diagnostics
              </p>
            </div>
          </div>

          <div className="header-actions">

            <button
              type="button"
              onClick={() => setIsSyntheticModalOpen(true)}
              className="btn-secondary !py-2"
            >
              <Database size={15} />
              <span className="hidden sm:inline">
                Test scenarios
              </span>
            </button>

            <div className="status-pill">
              <span
                className={`status-dot ${
                  telemetryError ? 'error' : ''
                }`}
              />

              <span>
                {telemetryError
                  ? 'Server unavailable'
                  : 'System connected'}
              </span>
            </div>

            <div className="status-pill hidden md:flex">
              <Shield size={14} className="text-amber-400" />
              <span>WHO PQS E003</span>
            </div>

          </div>
        </div>
      </header>


      {/* MAIN DASHBOARD */}

      <main className="app-container flex-grow">

        {/* INTRODUCTION */}

        <div className="flex items-end justify-between gap-5 flex-wrap mb-7">

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#42c9ad] mb-3">
              FIELD DIAGNOSTICS
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Equipment health check
            </h2>

            <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
              Check the fault, enter your measurements and find
              out what needs attention.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#42c9ad]" />
              <span>Local processing</span>
            </div>

            <span className="text-slate-700">/</span>

            <span className="mono">
              {electronicUnit}
            </span>
          </div>

        </div>


        {/* API ERROR */}

        {apiError && (
          <div className="mb-5 bg-red-950/30 border border-red-500/25 rounded-xl p-4 flex items-start justify-between gap-3">

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <XCircle size={19} className="text-red-400" />
              </div>

              <div>
                <p className="text-sm font-bold text-red-200">
                  Diagnosis could not be completed
                </p>

                <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                  {apiError}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setApiError(null)}
              className="text-red-400 hover:text-white"
              aria-label="Dismiss error"
            >
              <XCircle size={17} />
            </button>

          </div>
        )}


        {/* QUICK TEST SCENARIOS */}

        <section className="preset-bar mb-5">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#26344a] flex items-center justify-center text-amber-400">
              <Activity size={18} />
            </div>

            <div>
              <h3 className="text-xs font-bold text-white">
                Quick test scenarios
              </h3>

              <p className="text-[10px] text-slate-500 mt-1">
                Load sample readings to try the diagnostic system.
              </p>
            </div>
          </div>

          <div className="preset-actions">

            <button
              type="button"
              onClick={() => {
                setSelectedBlink(3);
                setVoltage('12.2');
                setResistance('4.8');
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="preset-button"
            >
              <span className="text-red-400">01</span>
              {' '}Motor fault
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedBlink(1);
                setVoltage('10.1');
                setResistance('2.1');
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="preset-button"
            >
              <span className="text-amber-400">02</span>
              {' '}Low voltage
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedBlink(2);
                setVoltage('12.4');
                setFanAmperage('0.72');
                setDiagnosticPlan(null);
                setApiError(null);
              }}
              className="preset-button"
            >
              <span className="text-cyan-400">03</span>
              {' '}Fan overload
            </button>

          </div>
        </section>


        {/* DIAGNOSTIC WORKSPACE */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* LEFT: FAULT AND READINGS */}

          <div className="lg:col-span-8 space-y-5">

            <BlinkSelector
              selectedBlink={selectedBlink}
              onSelectBlink={(b) => {
                setSelectedBlink(b);
                clearDiagnosis();
              }}
            />

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


          {/* RIGHT: EQUIPMENT AND SYSTEM */}

          <div className="lg:col-span-4 space-y-5">

            <NameplateScanner
              detectedModel={detectedModel}
              electronicUnit={electronicUnit}
              onModelChange={(m, u) => {
                setDetectedModel(m);
                setElectronicUnit(u);
              }}
            />

            <MemoryMonitor telemetry={telemetry} />

            {/* MAIN ACTION */}

            <div className="section-card !p-5">

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                  <Zap size={17} className="text-amber-400" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">
                    Ready to check?
                  </h3>

                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Review your readings before continuing.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-5">

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Fault code
                  </span>

                  <span className="text-white font-semibold mono">
                    {selectedBlink} {selectedBlink === 1 ? 'flash' : 'flashes'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Compressor
                  </span>

                  <span className="text-white font-semibold mono">
                    {detectedModel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Supply voltage
                  </span>

                  <span className="text-white font-semibold mono">
                    {voltage || '—'} V
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Motor resistance
                  </span>

                  <span className="text-white font-semibold mono">
                    {resistance || '—'} Ω
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={handleRunDiagnostic}
                disabled={loading}
                className="btn-primary w-full !py-4 !text-sm"
              >
                {loading ? (
                  <span className="loading-ring !w-5 !h-5 !border-2" />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}

                <span>
                  {loading
                    ? 'Checking equipment...'
                    : 'Run diagnosis'}
                </span>

                {!loading && <ArrowRight size={17} />}
              </button>

              <p className="text-[10px] text-center text-slate-500 mt-3">
                Processed using the local diagnostic engine.
              </p>

            </div>

          </div>

        </div>


        {/* CONNECTION DIAGRAM */}

        <div className="mt-5">
          <SchematicVisualizer
            activePins={
              diagnosticPlan?.schematicFocusPins ||
              ['+', '-', 'D']
            }
            blinkCode={selectedBlink}
          />
        </div>


        {/* DIAGNOSTIC RESULTS */}

        <div className="mt-5">
          <DiagnosticReport
            plan={diagnosticPlan}
            loading={loading}
            onOpenLogModal={() => setIsLogModalOpen(true)}
          />
        </div>

      </main>


      {/* MODALS */}

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


      {/* FOOTER */}

      <footer className="app-footer">
        <div className="footer-inner">

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#26344a] flex items-center justify-center">
              <Stethoscope
                size={13}
                className="text-amber-400"
              />
            </div>

            <span className="font-semibold text-slate-400">
              ColdChainGuard
            </span>

            <span className="text-slate-700">·</span>

            <span>Equipment diagnostics</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span>
              Local processing enabled
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
};