import React from 'react';
import { Gauge, ShieldAlert } from 'lucide-react';

interface MultimeterProps {
  voltage: string;
  resistance: string;
  fanAmperage: string;
  ambientTemp: string;
  onChange: (field: string, value: string) => void;
}

export const MultimeterInput: React.FC<MultimeterProps> = ({
  voltage,
  resistance,
  fanAmperage,
  ambientTemp,
  onChange,
}) => {
  const vNum = parseFloat(voltage);
  const isVoltageLow = !isNaN(vNum) && vNum < 10.4;

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-4 shadow-xl">
      <div className="flex items-center space-x-2 mb-3 border-b border-tactical-700/50 pb-2">
        <Gauge className="w-5 h-5 text-tactical-cyan" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Field Multimeter Telemetry
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <label className="text-[11px] font-mono font-medium text-slate-400 block mb-1">
            TERMINAL DC VOLTS [+] & [-]
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={voltage}
              onChange={(e) => onChange('voltage', e.target.value)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-tactical-cyan"
              placeholder="12.1"
            />
            <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-500">V DC</span>
          </div>
          {isVoltageLow && (
            <div className="flex items-center space-x-1 mt-1 text-[10px] text-amber-400 font-mono">
              <ShieldAlert className="w-3 h-3" />
              <span>Below 10.4V Cut-Out</span>
            </div>
          )}
        </div>

        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <label className="text-[11px] font-mono font-medium text-slate-400 block mb-1">
            MOTOR STATOR RESISTANCE
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={resistance}
              onChange={(e) => onChange('resistance', e.target.value)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-tactical-cyan"
              placeholder="2.1"
            />
            <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-500">Ω (Ohms)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">WHO Norm: 2.1Ω ± 0.3</span>
        </div>

        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <label className="text-[11px] font-mono font-medium text-slate-400 block mb-1">
            FAN CURRENT LOAD [F]
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              value={fanAmperage}
              onChange={(e) => onChange('fanAmperage', e.target.value)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-tactical-cyan"
              placeholder="0.30"
            />
            <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-500">AMPS</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">Max Ceiling: 0.50A</span>
        </div>

        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <label className="text-[11px] font-mono font-medium text-slate-400 block mb-1">
            CABINET ENCLOSURE TEMP
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              value={ambientTemp}
              onChange={(e) => onChange('ambientTemp', e.target.value)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none focus:border-tactical-cyan"
              placeholder="34"
            />
            <span className="absolute right-2.5 top-2 text-xs font-mono text-slate-500">°C</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 block mt-1">PQS Limit: 43°C Class T</span>
        </div>
      </div>
    </div>
  );
};
