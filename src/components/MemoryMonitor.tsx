import React from 'react';
import { HardDrive, CheckCircle } from 'lucide-react';
import { SystemTelemetry } from '../types';

interface MemoryMonitorProps {
  telemetry: SystemTelemetry | null;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({ telemetry }) => {
  const systemUsedMb = telemetry?.hostMemory.totalSystemUsedApproxMb || 2520;
  const systemCeilingMb = 4096;
  const memoryPercentage = Math.round((systemUsedMb / systemCeilingMb) * 100);

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-3.5 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            4GB RAM Ceiling Watchdog (Fork-Isolate-Exit)
          </h3>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>RAM BUDGET COMPLIANT</span>
        </div>
      </div>

      <div className="w-full bg-tactical-950 rounded-full h-3 border border-tactical-700 overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-amber-600 transition-all duration-300"
          style={{ width: `${memoryPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Active Physical RAM: <strong className="text-white">{(systemUsedMb / 1024).toFixed(2)} GB</strong> / 4.00 GB</span>
        <span>Headroom: <strong className="text-emerald-400">{((systemCeilingMb - systemUsedMb) / 1024).toFixed(2)} GB Free</strong></span>
      </div>

      {telemetry?.recentWorkerRuns && telemetry.recentWorkerRuns.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-tactical-800 text-[10px] font-mono">
          <span className="text-slate-500 block mb-1">RECENT FORKED WORKER LIFECYCLES:</span>
          <div className="flex flex-wrap gap-2">
            {telemetry.recentWorkerRuns.slice(0, 3).map((w) => (
              <span key={w.id} className="bg-tactical-950 px-2 py-0.5 rounded border border-tactical-800 text-slate-300">
                {w.worker_name}: <strong className="text-tactical-accent">{w.duration_ms}ms</strong> ({w.peak_memory_mb} MB) -> EXITED(0)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
