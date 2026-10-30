import React from 'react';
import { Cpu, Target } from 'lucide-react';

interface SchematicVisualizerProps {
  activePins: string[];
  blinkCode: number;
}

export const SchematicVisualizer: React.FC<SchematicVisualizerProps> = ({
  activePins,
  blinkCode,
}) => {
  const isPinActive = (pinName: string) =>
    activePins.includes(pinName);

  return (
    <section className="section-card">
      <div className="section-heading">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#26344a] flex items-center justify-center text-amber-400">
            <Cpu size={20} />
          </div>

          <div>
            <h2 className="section-title">Controller connection diagram</h2>
            <p className="section-description">
              Terminal locations and the points used in this test.
            </p>
          </div>
        </div>

        <div className="status-pill">
          <Target size={14} className="text-amber-400" />
          <span>{activePins.length} active test points</span>
        </div>
      </div>

      <div className="schematic-wrap">
        <svg
          viewBox="0 0 760 260"
          className="schematic-svg"
          role="img"
          aria-label="Secop electronic controller terminal diagram"
        >
          <defs>
            <linearGradient
              id="controllerGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#172538" />
              <stop offset="100%" stopColor="#0d1624" />
            </linearGradient>

            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            x="20"
            y="20"
            width="720"
            height="220"
            rx="12"
            fill="url(#controllerGrad)"
            stroke="#35465d"
            strokeWidth="1.5"
          />

          <text
            x="40"
            y="45"
            fill="#b3c0d1"
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
          >
            SECOP / DANFOSS BD35F ELECTRONIC UNIT
          </text>

          <text
            x="40"
            y="61"
            fill="#718198"
            fontFamily="monospace"
            fontSize="9"
          >
            CONTROLLER 101N0210
          </text>

          <text
            x="610"
            y="45"
            fill="#e8b54e"
            fontFamily="monospace"
            fontSize="10"
          >
            WHO PQS E003
          </text>

          <g transform="translate(60, 78)">
            <rect
              x="0"
              y="0"
              width="130"
              height="130"
              rx="9"
              fill="#0a1421"
              stroke="#35465d"
              strokeWidth="1.5"
            />

            <text
              x="65"
              y="19"
              textAnchor="middle"
              fill="#8293a9"
              fontFamily="monospace"
              fontSize="9"
            >
              MOTOR OUTPUT
            </text>

            {[
              { x: 65, y: 49, label: '1' },
              { x: 40, y: 96, label: '2' },
              { x: 90, y: 96, label: '3' },
            ].map((pin) => (
              <g key={pin.label}>
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r="10"
                  fill={blinkCode === 3 ? '#8e343d' : '#23364c'}
                  stroke="#e8b54e"
                  strokeWidth="1.8"
                  filter={blinkCode === 3 ? 'url(#glow)' : undefined}
                />

                <text
                  x={pin.x}
                  y={pin.y + 3}
                  textAnchor="middle"
                  fill="#fff"
                  fontFamily="monospace"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {pin.label}
                </text>
              </g>
            ))}

            <text
              x="65"
              y="120"
              textAnchor="middle"
              fill="#8293a9"
              fontFamily="monospace"
              fontSize="9"
            >
              MOTOR TERMINALS
            </text>
          </g>

          {[
            { id: '+', x: 230, label: '+', desc: 'Battery positive' },
            { id: '-', x: 300, label: '−', desc: 'Battery negative' },
            { id: 'F', x: 370, label: 'F', desc: 'Fan output' },
            { id: 'D', x: 440, label: 'D', desc: 'LED diagnostics' },
            { id: 'C', x: 510, label: 'C', desc: 'Speed control' },
            { id: 'P', x: 580, label: 'P', desc: 'Solar switch' },
            { id: 'T', x: 650, label: 'T', desc: 'Thermostat' },
          ].map((term) => {
            const active = isPinActive(term.id);

            return (
              <g
                key={term.id}
                transform={`translate(${term.x}, 80)`}
              >
                <rect
                  x="0"
                  y="0"
                  width="54"
                  height="116"
                  rx="7"
                  fill={active ? '#3a301c' : '#111d2d'}
                  stroke={active ? '#e8b54e' : '#35465d'}
                  strokeWidth={active ? 2 : 1}
                  filter={active ? 'url(#glow)' : undefined}
                />

                <circle
                  cx="27"
                  cy="23"
                  r="10"
                  fill="#34455c"
                  stroke="#8293a9"
                  strokeWidth="1"
                />

                <line
                  x1="21"
                  y1="23"
                  x2="33"
                  y2="23"
                  stroke="#d0dae6"
                  strokeWidth="2"
                />

                <text
                  x="27"
                  y="63"
                  textAnchor="middle"
                  fill={active ? '#ffd477' : '#e2e8f0'}
                  fontFamily="monospace"
                  fontSize="17"
                  fontWeight="bold"
                >
                  {term.label}
                </text>

                <rect
                  x="5"
                  y="77"
                  width="44"
                  height="17"
                  rx="4"
                  fill={active ? '#e8b54e' : '#22334a'}
                />

                <text
                  x="27"
                  y="89"
                  textAnchor="middle"
                  fill={active ? '#15130e' : '#91a0b5'}
                  fontFamily="monospace"
                  fontSize="8"
                  fontWeight="bold"
                >
                  {active ? 'ACTIVE' : 'READY'}
                </text>

                <text
                  x="27"
                  y="108"
                  textAnchor="middle"
                  fill="#8293a9"
                  fontFamily="monospace"
                  fontSize="8"
                >
                  {term.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
        <div className="flex items-center gap-5 text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#e8b54e]" />
            Active test point
          </span>

          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#34455c]" />
            Other terminal
          </span>
        </div>

        <span className="text-[11px] text-slate-500 mono">
          {activePins.join(' · ') || 'No active points'}
        </span>
      </div>
    </section>
  );
};