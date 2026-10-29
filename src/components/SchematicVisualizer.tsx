import React from 'react';
import { Cpu, Target } from 'lucide-react';

interface SchematicVisualizerProps {
  activePins: string[];
  blinkCode: number;
}

export const SchematicVisualizer: React.FC<SchematicVisualizerProps> = ({ activePins, blinkCode }) => {
  const isPinActive = (pinName: string) => activePins.includes(pinName);

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-tactical-700/50 pb-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-tactical-accent" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Secop 101N0210 Terminal Pinout & Multimeter Test Probes
          </h2>
        </div>
        <div className="flex items-center space-x-1 text-xs font-mono text-slate-400">
          <Target className="w-3.5 h-3.5 text-tactical-accent" />
          <span>Active Test Points: {activePins.join(', ') || 'None'}</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 760 260"
          className="w-full h-auto max-h-56 bg-tactical-950 rounded border border-tactical-800"
        >
          <defs>
            <linearGradient id="controllerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#161c28" />
              <stop offset="100%" stopColor="#0d1117" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          <rect x="20" y="20" width="720" height="220" rx="8" fill="url(#controllerGrad)" stroke="#2a364d" strokeWidth="2" />
          <text x="40" y="45" fill="#94a3b8" fontFamily="monospace" fontSize="12" fontWeight="bold">
            SECOP / DANFOSS BD35F ELECTRONIC UNIT (101N0210)
          </text>
          <text x="560" y="45" fill="#e69b00" fontFamily="monospace" fontSize="11">
            WHO PQS E003 CLASS A
          </text>

          <g transform="translate(60, 70)">
            <rect x="0" y="0" width="130" height="130" rx="6" fill="#111620" stroke="#334155" strokeWidth="1.5" />
            <text x="12" y="22" fill="#64748b" fontFamily="monospace" fontSize="10" fontWeight="bold">
              MOTOR FEEDTHROUGH
            </text>

            <circle
              cx="65"
              cy="48"
              r="9"
              fill={blinkCode === 3 ? "#ef4444" : "#1e293b"}
              stroke="#e69b00"
              strokeWidth="2"
              filter={blinkCode === 3 ? "url(#glow)" : undefined}
            />
            <text x="61" y="52" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="bold">1</text>

            <circle
              cx="40"
              cy="95"
              r="9"
              fill={blinkCode === 3 ? "#ef4444" : "#1e293b"}
              stroke="#e69b00"
              strokeWidth="2"
              filter={blinkCode === 3 ? "url(#glow)" : undefined}
            />
            <text x="36" y="99" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="bold">2</text>

            <circle
              cx="90"
              cy="95"
              r="9"
              fill={blinkCode === 3 ? "#ef4444" : "#1e293b"}
              stroke="#e69b00"
              strokeWidth="2"
              filter={blinkCode === 3 ? "url(#glow)" : undefined}
            />
            <text x="86" y="99" fill="#ffffff" fontFamily="monospace" fontSize="9" fontWeight="bold">3</text>
            <text x="25" y="122" fill="#94a3b8" fontFamily="monospace" fontSize="9">Phase = 2.1Ω</text>
          </g>

          {[
            { id: '+', x: 230, label: '+', desc: 'Battery DC Pos (12V)' },
            { id: '-', x: 300, label: '-', desc: 'Battery DC Neg' },
            { id: 'F', x: 370, label: 'F', desc: 'Condenser Fan (Max 0.5A)' },
            { id: 'D', x: 440, label: 'D', desc: 'LED Diagnostic Out' },
            { id: 'C', x: 510, label: 'C', desc: 'Speed / Cutout Resistor' },
            { id: 'P', x: 580, label: 'P', desc: 'Solar PTC Switch' },
            { id: 'T', x: 650, label: 'T', desc: 'Thermostat Contact' },
          ].map((term) => {
            const active = isPinActive(term.id);
            return (
              <g key={term.id} transform={`translate(${term.x}, 70)`}>
                <rect
                  x="0"
                  y="0"
                  width="55"
                  height="115"
                  rx="4"
                  fill={active ? '#2e1c0c' : '#111620'}
                  stroke={active ? '#e69b00' : '#334155'}
                  strokeWidth={active ? 2.5 : 1}
                  filter={active ? 'url(#glow)' : undefined}
                />
                <circle cx="27.5" cy="25" r="10" fill="#334155" stroke="#64748b" strokeWidth="1" />
                <line x1="22" y1="25" x2="33" y2="25" stroke="#94a3b8" strokeWidth="2" />

                <text
                  x="27.5"
                  y="62"
                  textAnchor="middle"
                  fill={active ? '#e69b00' : '#ffffff'}
                  fontFamily="monospace"
                  fontSize="16"
                  fontWeight="bold"
                >
                  {term.label}
                </text>

                <rect
                  x="5"
                  y="78"
                  width="45"
                  height="16"
                  rx="2"
                  fill={active ? '#e69b00' : '#1e293b'}
                />
                <text
                  x="27.5"
                  y="90"
                  textAnchor="middle"
                  fill={active ? '#0a0d12' : '#64748b'}
                  fontFamily="monospace"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {active ? 'PROBE' : 'OFF'}
                </text>

                <text x="27.5" y="132" textAnchor="middle" fill="#64748b" fontFamily="monospace" fontSize="8">
                  {term.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
