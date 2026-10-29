import React from 'react';
import { X, Database, Sliders, ArrowRight } from 'lucide-react';
import { SyntheticBenchmarkCase } from '../types';

interface SyntheticDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  benchmarks: SyntheticBenchmarkCase[];
  onApplyBenchmark: (bm: SyntheticBenchmarkCase) => void;
}

export const SyntheticDataModal: React.FC<SyntheticDataModalProps> = ({
  isOpen,
  onClose,
  benchmarks,
  onApplyBenchmark,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-tactical-900 border border-tactical-700 rounded-lg max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-tactical-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-tactical-cyan" />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Synthetic Benchmark Data & Ground Truth Transparency
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                WHO PQS E003 Pre-calibrated Electrical Fault Scenarios
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-tactical-950 p-3 rounded border border-tactical-800 text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-tactical-accent">How This Works: </span>
          ColdChainGuard uses these pre-calibrated synthetic bench datasets to simulate extreme physical field conditions (such as rotor lock or line voltage drops) without requiring a physical refrigerator. Technicians can inspect the exact telemetry values used and click <strong>Apply To Live Bench</strong> to execute real-time isolation, or overwrite them with actual physical multimeter probes.
        </div>

        <div className="space-y-3">
          {benchmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-tactical-950 p-3.5 rounded border border-tactical-800 hover:border-tactical-700 transition space-y-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold bg-tactical-800 px-1.5 py-0.5 rounded text-tactical-accent">
                      {bm.id}
                    </span>
                    <h4 className="text-xs font-bold text-white">{bm.name}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{bm.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onApplyBenchmark(bm);
                    onClose();
                  }}
                  className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-tactical-accent hover:text-white px-3 py-1.5 rounded text-xs font-mono font-semibold flex items-center space-x-1 transition"
                >
                  <span>Apply To Live Bench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono bg-tactical-900/60 p-2 rounded border border-tactical-800">
                <div>
                  <span className="text-slate-500 block">MODEL:</span>
                  <span className="text-slate-200">{bm.compressorModel}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">BLINK CODE:</span>
                  <span className="text-tactical-accent font-bold">{bm.blinkCode} Blinks</span>
                </div>
                <div>
                  <span className="text-slate-500 block">VOLTAGE:</span>
                  <span className="text-slate-200">{bm.inputVoltage}V DC</span>
                </div>
                <div>
                  <span className="text-slate-500 block">STATOR RES:</span>
                  <span className="text-slate-200">{bm.windingResistance} Ω</span>
                </div>
                <div>
                  <span className="text-slate-500 block">AMBIENT:</span>
                  <span className="text-slate-200">{bm.ambientTemp}°C</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500 font-mono">Expected Outcome: </span>
                <span>{bm.expectedRootCause}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
