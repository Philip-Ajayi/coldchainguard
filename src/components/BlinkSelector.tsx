import React, { useEffect, useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';

interface BlinkSelectorProps {
  selectedBlink: number;
  onSelectBlink: (code: number) => void;
}

const BLINK_DEFINITIONS = [
  { code: 1, label: "1 BLINK", title: "Battery Cut-out", desc: "DC terminal voltage below 10.4V or high line resistance" },
  { code: 2, label: "2 BLINKS", title: "Fan Overcurrent", desc: "Condenser fan drawing > 0.5A on Terminal [F]" },
  { code: 3, label: "3 BLINKS", title: "Motor Start Fail", desc: "Rotor lock or differential pressure > 5.0 bar" },
  { code: 4, label: "4 BLINKS", title: "Minimum Speed", desc: "Compressor velocity dropped below 1,850 RPM" },
  { code: 5, label: "5 BLINKS", title: "Thermal Overheat", desc: "Inverter heatsink temperature exceeded 85°C" },
];

export const BlinkSelector: React.FC<BlinkSelectorProps> = ({ selectedBlink, onSelectBlink }) => {
  const [ledLit, setLedLit] = useState(false);

  useEffect(() => {
    let blinkCounter = 0;
    let isPause = false;

    const interval = setInterval(() => {
      if (isPause) {
        setLedLit(false);
        blinkCounter++;
        if (blinkCounter >= 8) {
          isPause = false;
          blinkCounter = 0;
        }
      } else {
        setLedLit(prev => !prev);
        blinkCounter++;
        if (blinkCounter >= selectedBlink * 2) {
          setLedLit(false);
          isPause = true;
          blinkCounter = 0;
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [selectedBlink]);

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-tactical-700/50 pb-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-tactical-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Diagnostic LED Pulse Rhythm
          </h2>
        </div>

        <div className="flex items-center space-x-2 bg-tactical-950 px-3 py-1 rounded border border-tactical-700">
          <span className="text-[11px] font-mono text-slate-400">PULSE:</span>
          <div className="relative flex items-center justify-center">
            <div className={`w-3.5 h-3.5 rounded-full transition-all duration-100 ${ledLit
                ? 'bg-red-500 shadow-[0_0_12px_#ef4444]'
                : 'bg-red-950/60 border border-red-900'
              }`} />
          </div>
          <span className="text-xs font-mono font-bold text-red-400 w-12 text-center">
            {ledLit ? 'FLASH' : 'IDLE'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {BLINK_DEFINITIONS.map((def) => {
          const isSelected = selectedBlink === def.code;
          return (
            <button
              key={def.code}
              type="button"
              onClick={() => onSelectBlink(def.code)}
              className={`flex flex-col text-left p-2.5 rounded-md border transition-all duration-150 ${isSelected
                  ? 'bg-tactical-800 border-tactical-accent shadow-[0_0_8px_rgba(230,155,0,0.25)]'
                  : 'bg-tactical-950/70 border-tactical-700/50 hover:border-slate-500 text-slate-400'
                }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-mono font-extrabold px-1.5 py-0.5 rounded ${isSelected ? 'bg-tactical-accent text-tactical-950' : 'bg-tactical-800 text-slate-300'
                  }`}>
                  {def.label}
                </span>
                {isSelected && <AlertCircle className="w-3.5 h-3.5 text-tactical-accent" />}
              </div>
              <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {def.title}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                {def.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
