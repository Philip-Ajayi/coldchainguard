import React from 'react';
import {
  X,
  Database,
  ArrowRight,
  Activity,
  Thermometer,
  Zap,
  Cpu,
  Gauge,
  BookOpen,
} from 'lucide-react';
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
    <div className="modal-overlay">
      <div className="modal-panel max-w-[850px]">
        <div className="modal-heading">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#26344a] flex items-center justify-center text-amber-400">
              <Database size={21} />
            </div>

            <div>
              <h3 className="modal-title">
                Test scenario library
              </h3>

              <p className="modal-description">
                Try known fault scenarios using sample readings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close benchmarks"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-info flex items-start gap-3 mb-5">
          <BookOpen
            size={18}
            className="flex-shrink-0 mt-0.5 text-[#42c9ad]"
          />

          <p>
            These are simulated test cases, not readings from a
            physical refrigerator. Select a scenario to load its
            values into the diagnostic bench.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">
              Available scenarios
            </h4>

            <p className="text-xs text-slate-500 mt-1">
              {benchmarks.length} reference cases
            </p>
          </div>

          <span className="status-pill">
            <Activity size={13} className="text-[#42c9ad]" />
            Sample data
          </span>
        </div>

        <div className="space-y-3">
          {benchmarks.map((bm) => (
            <div
              key={bm.id}
              className="bg-[#0d1624] border border-white/10 rounded-xl p-4 hover:border-amber-400/30 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="mono text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">
                      {bm.id}
                    </span>

                    <h4 className="text-sm font-bold text-white">
                      {bm.name}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {bm.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onApplyBenchmark(bm);
                    onClose();
                  }}
                  className="btn-primary !py-2.5 !px-3 !text-xs"
                >
                  Load scenario
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                <div className="step-detail">
                  <span className="step-detail-label flex items-center gap-1">
                    <Cpu size={11} />
                    Compressor
                  </span>

                  <span className="step-detail-value">
                    {bm.compressorModel}
                  </span>
                </div>

                <div className="step-detail">
                  <span className="step-detail-label flex items-center gap-1">
                    <Activity size={11} />
                    LED flashes
                  </span>

                  <span className="step-detail-value text-amber-400">
                    {bm.blinkCode}
                  </span>
                </div>

                <div className="step-detail">
                  <span className="step-detail-label flex items-center gap-1">
                    <Zap size={11} />
                    Voltage
                  </span>

                  <span className="step-detail-value">
                    {bm.inputVoltage}V
                  </span>
                </div>

                <div className="step-detail">
                  <span className="step-detail-label flex items-center gap-1">
                    <Gauge size={11} />
                    Resistance
                  </span>

                  <span className="step-detail-value">
                    {bm.windingResistance}Ω
                  </span>
                </div>

                <div className="step-detail">
                  <span className="step-detail-label flex items-center gap-1">
                    <Thermometer size={11} />
                    Temperature
                  </span>

                  <span className="step-detail-value">
                    {bm.ambientTemp}°C
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Expected result
                </span>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {bm.expectedRootCause}
                </p>
              </div>
            </div>
          ))}

          {benchmarks.length === 0 && (
            <div className="text-center py-12">
              <Database
                size={28}
                className="text-slate-600 mx-auto mb-3"
              />

              <p className="text-sm font-semibold text-slate-300">
                No test scenarios available
              </p>

              <p className="text-xs text-slate-500 mt-1">
                The benchmark library could not be loaded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};