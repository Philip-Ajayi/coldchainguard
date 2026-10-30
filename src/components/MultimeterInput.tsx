import React from 'react';
import { Gauge, ShieldAlert, Activity } from 'lucide-react';

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

  const measurements = [
    {
      field: 'voltage',
      label: 'Supply voltage',
      description: 'Battery terminals (+) and (-)',
      value: voltage,
      unit: 'V DC',
      placeholder: '12.1',
      step: '0.1',
      note: 'Cut-out threshold: 10.4V',
      alert: isVoltageLow,
      alertText: 'Voltage is below the cut-out threshold.',
    },
    {
      field: 'resistance',
      label: 'Motor resistance',
      description: 'Stator winding resistance',
      value: resistance,
      unit: 'Ω',
      placeholder: '2.1',
      step: '0.1',
      note: 'Reference: 2.1Ω ± 0.3',
    },
    {
      field: 'fanAmperage',
      label: 'Fan current',
      description: 'Current measured at terminal F',
      value: fanAmperage,
      unit: 'A',
      placeholder: '0.35',
      step: '0.05',
      note: 'Maximum: 0.50A',
    },
    {
      field: 'ambientTemp',
      label: 'Ambient temperature',
      description: 'Temperature around the cabinet',
      value: ambientTemp,
      unit: '°C',
      placeholder: '34',
      step: '1',
      note: 'WHO PQS Class T limit: 43°C',
    },
  ];

  return (
    <section className="section-card">
      <div className="section-heading">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#173b43] flex items-center justify-center text-[#42c9ad]">
            <Gauge size={20} />
          </div>

          <div>
            <h2 className="section-title">Electrical measurements</h2>
            <p className="section-description">
              Enter the values from your multimeter.
            </p>
          </div>
        </div>

        <span className="status-pill">
          <Activity size={13} className="text-[#42c9ad]" />
          Field readings
        </span>
      </div>

      <div className="measurement-grid">
        {measurements.map((item) => (
          <div className="measurement-card" key={item.field}>
            <label
              htmlFor={`measurement-${item.field}`}
              className="field-label"
            >
              {item.label}
            </label>

            <p className="text-[10px] text-slate-500 mb-3">
              {item.description}
            </p>

            <div className="relative">
              <input
                id={`measurement-${item.field}`}
                type="number"
                step={item.step}
                value={item.value}
                onChange={(e) =>
                  onChange(item.field, e.target.value)
                }
                className="field-input"
                placeholder={item.placeholder}
              />

              <span className="measurement-unit mono">
                {item.unit}
              </span>
            </div>

            {item.alert ? (
              <div className="measurement-alert">
                <ShieldAlert size={13} />
                <span>{item.alertText}</span>
              </div>
            ) : (
              <span className="measurement-note">
                {item.note}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};