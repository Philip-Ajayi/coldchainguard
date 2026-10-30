import React from 'react';
import {
  CheckSquare,
  AlertTriangle,
  BookOpen,
  Wrench,
  ShieldCheck,
  Flame,
  Download,
  CheckCircle2,
} from 'lucide-react';
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
      <section className="section-card py-16">
        <div className="flex flex-col items-center text-center">
          <div className="loading-ring mb-5" />

          <h3 className="text-base font-bold text-white">
            Checking the readings
          </h3>

          <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
            ColdChainGuard is comparing the measurements with its
            diagnostic references and preparing a test plan.
          </p>

          <div className="flex items-center gap-2 mt-5 text-[11px] text-[#42c9ad]">
            <span className="status-dot" />
            Local diagnostic engine running
          </div>
        </div>
      </section>
    );
  }

  if (!plan) {
    return (
      <section className="section-card">
        <div className="max-w-lg mx-auto py-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1a293d] flex items-center justify-center text-slate-400 mb-5">
            <Wrench size={25} />
          </div>

          <h3 className="text-lg font-bold text-white">
            Your diagnostic report will appear here
          </h3>

          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Select the fault code, enter your meter readings and
            identify the equipment. Then run the diagnosis to get
            a step-by-step testing guide.
          </p>
        </div>
      </section>
    );
  }

  const isCritical = plan.severity === 'CRITICAL_SPOILAGE_RISK';

  return (
    <section className="section-card space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={17} className="text-[#42c9ad]" />
            <span className="text-xs font-semibold text-[#42c9ad]">
              Diagnostic report ready
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mt-2 tracking-tight">
            Findings and next steps
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            Review the likely cause and follow the recommended checks.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="btn-secondary"
        >
          <Download size={15} />
          <span>Save service record</span>
        </button>
      </div>

      <div
        className={`report-header ${
          isCritical ? 'report-critical' : 'report-warning'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isCritical
                ? 'bg-red-500/15 text-red-400'
                : 'bg-amber-400/15 text-amber-400'
            }`}
          >
            {isCritical ? (
              <Flame size={22} />
            ) : (
              <AlertTriangle size={22} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  isCritical
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-400 text-[#211808]'
                }`}
              >
                {plan.status}
              </span>

              <span className="text-[10px] text-slate-400">
                {isCritical ? 'Critical risk' : 'Requires attention'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white mt-3 leading-snug">
              {plan.faultSummary}
            </h3>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {plan.rootCause}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#0d1624] border border-white/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#173b43] flex items-center justify-center text-[#42c9ad] flex-shrink-0">
            <BookOpen size={18} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">
              Reference used
            </p>

            <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
              {plan.authorityCitation}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-[#28354a] flex items-center justify-center text-amber-400">
            <Wrench size={18} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">
              Recommended tests
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Follow these steps to isolate the fault.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {plan.recommendedSteps.map((step) => (
            <div
              key={step.stepNumber}
              className="report-step"
            >
              <div className="step-number">
                {step.stepNumber}
              </div>

              <div className="flex-1 min-w-0 space-y-4">
                <p className="text-sm text-slate-100 font-medium leading-relaxed">
                  {step.instruction}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="step-detail">
                    <span className="step-detail-label">
                      Test points
                    </span>

                    <span className="step-detail-value text-amber-400">
                      {step.targetTerminals.join(', ')}
                    </span>
                  </div>

                  <div className="step-detail">
                    <span className="step-detail-label">
                      Expected reading
                    </span>

                    <span className="step-detail-value text-[#42c9ad]">
                      {step.expectedValue}
                    </span>
                  </div>

                  <div className="step-detail">
                    <span className="step-detail-label">
                      Meter setting
                    </span>

                    <span className="step-detail-value">
                      {step.multimeterMode}
                    </span>
                  </div>
                </div>

                <div className="failure-note">
                  <span className="font-bold text-red-300">
                    If the reading is wrong:{' '}
                  </span>
                  {step.failureCondition}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-[rgba(66,201,173,0.055)] border border-[rgba(66,201,173,0.2)] p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#173b43] flex items-center justify-center text-[#42c9ad] flex-shrink-0">
            <ShieldCheck size={19} />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">
              What to do after the repair
            </h3>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {plan.preventiveAction}
            </p>
          </div>

          <CheckSquare
            size={17}
            className="text-[#42c9ad] flex-shrink-0"
          />
        </div>
      </div>
    </section>
  );
};