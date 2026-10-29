import React from 'react';
import { CheckSquare, AlertTriangle, BookOpen, Wrench, ShieldCheck, Flame } from 'lucide-react';
import { DiagnosticPlan } from '../types';

interface DiagnosticReportProps {
  plan: DiagnosticPlan | null;
  loading: boolean;
  onOpenLogModal: () => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  plan,
  loading,
  onOpenLogModal,
}) => {
  if (loading) {
    return (
      <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-8 shadow-xl text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-tactical-accent border-r-transparent mb-3" />
        <h3 className="text-sm font-mono font-bold text-slate-200 uppercase">
          Executing Process-Isolated Diagnostic Synthesis...
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Stage 2 Vector Search & Stage 3 Grounded Engine active. Hard 512MB RAM cap.
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-8 shadow-xl text-center text-slate-400">
        Select blink code, check multimeter values, and click "Run Diagnostic Isolation" to generate grounded WHO testing sequence.
      </div>
    );
  }

  const isCritical = plan.severity === 'CRITICAL_SPOILAGE_RISK';

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-5 shadow-xl space-y-4">
      <div className={`p-3.5 rounded border flex items-start justify-between ${isCritical
          ? 'bg-red-950/40 border-red-800 text-red-200'
          : 'bg-amber-950/40 border-amber-800 text-amber-200'
        }`}>
        <div className="flex items-start space-x-3">
          {isCritical ? <Flame className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold ${isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                }`}>
                {plan.status}
              </span>
              <span className="text-[11px] font-mono text-slate-400">SEVERITY: {plan.severity}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1">{plan.faultSummary}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{plan.rootCause}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-slate-200 text-xs px-3 py-1.5 rounded flex items-center space-x-1.5 flex-shrink-0 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Export Service Log</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 text-xs font-mono bg-tactical-950 p-2.5 rounded border border-tactical-800 text-slate-300">
        <BookOpen className="w-4 h-4 text-tactical-cyan flex-shrink-0" />
        <span className="text-slate-400">Grounded Citation:</span>
        <span className="font-semibold text-tactical-cyan">{plan.authorityCitation}</span>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center space-x-1.5">
          <Wrench className="w-4 h-4 text-tactical-accent" />
          <span>Step-by-Step Electrical Circuit Isolation Sequence</span>
        </h4>

        <div className="space-y-2.5">
          {plan.recommendedSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="bg-tactical-950 p-3 rounded border border-tactical-800/80 hover:border-tactical-700 transition"
            >
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded bg-tactical-800 border border-tactical-700 text-tactical-accent font-mono font-bold text-xs flex items-center justify-center">
                  {step.stepNumber}
                </span>
                <div className="flex-grow space-y-1.5">
                  <p className="text-xs text-slate-100 font-medium">{step.instruction}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
                    <div className="bg-tactical-900 px-2 py-1 rounded border border-tactical-800">
                      <span className="text-slate-400">Target: </span>
                      <span className="text-tactical-accent font-semibold">{step.targetTerminals.join(', ')}</span>
                    </div>
                    <div className="bg-tactical-900 px-2 py-1 rounded border border-tactical-800">
                      <span className="text-slate-400">Expected: </span>
                      <span className="text-emerald-400">{step.expectedValue}</span>
                    </div>
                    <div className="bg-tactical-900 px-2 py-1 rounded border border-tactical-800">
                      <span className="text-slate-400">Meter Mode: </span>
                      <span className="text-cyan-400">{step.multimeterMode}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-red-300/80 bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                    <span className="font-semibold text-red-300">Failure Signature: </span>
                    {step.failureCondition}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-tactical-950 p-3 rounded border border-tactical-800 flex items-start space-x-2 text-xs text-slate-300">
        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Required Preventive Action: </span>
          <span>{plan.preventiveAction}</span>
        </div>
      </div>
    </div>
  );
};
