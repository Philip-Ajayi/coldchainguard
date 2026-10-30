import React from 'react';
import { HardDrive, CheckCircle, AlertOctagon } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface MemoryMonitorProps {
  telemetry: SystemTelemetry | null;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-3.5 shadow-xl text-center">
        <span className="text-xs font-mono text-slate-400 animate-pulse">
          Connecting to Host Process Telemetry...
        </span>
      </div>
    );
  }

  const systemUsedMb = telemetry.hostMemory.totalSystemUsedApproxMb;
  const systemCeilingMb = telemetry.hostMemory.systemCeilingMb || 4096;
  const memoryPercentage = Math.min(100, Math.round((systemUsedMb / systemCeilingMb) * 100));
  const isBudgetCompliant = memoryPercentage < 90;

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-3.5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Live Memory Ceiling Watchdog
          </h3>
        </div>
        <div className={`flex items-center space-x-1.5 text-[11px] font-mono ${isBudgetCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
          {isBudgetCompliant ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
          <span>{isBudgetCompliant ? 'RAM BUDGET OK' : 'HIGH RAM PRESSURE'}</span>
        </div>
      </div>

      <div className="w-full bg-tactical-950 rounded-full h-3 border border-tactical-700 overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-300 ${memoryPercentage > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 via-yellow-500 to-amber-600'}`}
          style={{ width: `${memoryPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Used RAM: <strong className="text-white">{(systemUsedMb / 1024).toFixed(2)} GB</strong> / {(systemCeilingMb / 1024).toFixed(2)} GB</span>
        <span>Free: <strong className="text-emerald-400">{Math.max(0, (systemCeilingMb - systemUsedMb) / 1024).toFixed(2)} GB</strong></span>
      </div>

      {telemetry.recentWorkerRuns && telemetry.recentWorkerRuns.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-tactical-800 text-[10px] font-mono">
          <span className="text-slate-500 block mb-1">RECENT WORKER LIFECYCLES:</span>
          <div className="flex flex-wrap gap-2">
            {telemetry.recentWorkerRuns.slice(0, 3).map((w) => (
              <span key={w.id} className="bg-tactical-950 px-2 py-0.5 rounded border border-tactical-800 text-slate-300">
                {w.worker_name}: <strong className="text-tactical-accent">{w.duration_ms}ms</strong> ({w.peak_memory_mb} MB) {"->"} EXIT({w.exit_code})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};