import React, { useEffect, useState } from 'react';
import { AlertCircle, Zap } from 'lucide-react';

interface BlinkSelectorProps {
  selectedBlink: number;
  onSelectBlink: (code: number) => void;
}

const BLINK_DEFINITIONS = [
  {
    code: 1,
    label: '01',
    title: 'Battery cut-out',
    desc: 'Low battery voltage or excessive cable resistance.',
  },
  {
    code: 2,
    label: '02',
    title: 'Fan overload',
    desc: 'The condenser fan is drawing too much current.',
  },
  {
    code: 3,
    label: '03',
    title: 'Motor failed to start',
    desc: 'Possible locked rotor or high pressure difference.',
  },
  {
    code: 4,
    label: '04',
    title: 'Low compressor speed',
    desc: 'Compressor speed has fallen below its required level.',
  },
  {
    code: 5,
    label: '05',
    title: 'Overheating',
    desc: 'The electronic unit has exceeded its temperature limit.',
  },
];

export const BlinkSelector: React.FC<BlinkSelectorProps> = ({
  selectedBlink,
  onSelectBlink,
}) => {
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
    <section className="section-card">
      <div className="section-heading">
        <div className="flex items-center gap-3">
          <div className="brand-mark !w-10 !h-10 !rounded-xl">
            <Zap size={19} />
          </div>

          <div>
            <h2 className="section-title">What is the LED showing?</h2>
            <p className="section-description">
              Select the number of flashes on the controller.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#0c1421] border border-white/10 rounded-xl px-3 py-2">
          <div
            className={`w-3 h-3 rounded-full ${
              ledLit
                ? 'bg-red-500 shadow-[0_0_15px_#ef4444]'
                : 'bg-red-950 border border-red-800'
            }`}
          />

          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">
              Controller LED
            </p>
            <p className="text-xs font-semibold text-slate-200">
              {ledLit ? 'Flashing' : 'Waiting'}
            </p>
          </div>
        </div>
      </div>

      <div className="blink-grid">
        {BLINK_DEFINITIONS.map((def) => {
          const isSelected = selectedBlink === def.code;

          return (
            <button
              key={def.code}
              type="button"
              onClick={() => onSelectBlink(def.code)}
              aria-pressed={isSelected}
              className={`blink-option ${
                isSelected ? 'active' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="blink-number">
                  {def.label} / {def.code} {def.code === 1 ? 'flash' : 'flashes'}
                </span>

                {isSelected ? (
                  <AlertCircle
                    size={16}
                    className="text-amber-400"
                  />
                ) : (
                  <span className="blink-indicator" />
                )}
              </div>

              <span className="blink-title">
                {def.title}
              </span>

              <span className="blink-description">
                {def.desc}
              </span>

              {isSelected && (
                <div className="mt-4 pt-3 border-t border-amber-400/20 text-[10px] font-semibold text-amber-400">
                  SELECTED FAULT
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};