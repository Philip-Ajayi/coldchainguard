import React, { useState } from 'react';
import {
  X,
  QrCode,
  Lock,
  Download,
  Check,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import { DiagnosticPlan } from '../types';

interface MaintenanceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DiagnosticPlan | null;
  blinkCode: number;
  voltage: string;
  resistance: string;
  compressorModel: string;
}

export const MaintenanceLogModal: React.FC<MaintenanceLogModalProps> = ({
  isOpen,
  onClose,
  plan,
  blinkCode,
  voltage,
  resistance,
  compressorModel,
}) => {
  const [clinicId, setClinicId] = useState('UNICEF-SSA-CLINIC-409');
  const [technicianId, setTechnicianId] = useState('TECH-MSF-382');
  const [serialNumber, setSerialNumber] = useState('BD35F-883921-X');
  const [correctiveAction, setCorrectiveAction] = useState(
    'Measured stator coils. Disconnected condenser fan to verify start.'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSignedLog = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/export-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          technicianId,
          refrigeratorModel: compressorModel,
          serialNumber,
          blinkCode,
          voltageReading: parseFloat(voltage) || 12.1,
          resistanceReading: parseFloat(resistance) || 2.1,
          identifiedRootCause: plan?.faultSummary || 'Routine Diagnostic',
          correctiveAction,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQrDataUrl(data.qrDataUrl);
        setHash(data.hash);
      }
    } catch {
      alert('Error generating encrypted maintenance record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel max-w-[620px]">
        <div className="modal-heading">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#173b43] flex items-center justify-center text-[#42c9ad]">
              <ClipboardList size={20} />
            </div>

            <div>
              <h3 className="modal-title">
                Maintenance record
              </h3>

              <p className="modal-description">
                Record the work carried out on this refrigerator.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            aria-label="Close maintenance record"
          >
            <X size={18} />
          </button>
        </div>

        {!qrDataUrl ? (
          <div className="space-y-5">
            <div className="modal-info flex items-start gap-3">
              <Lock size={18} className="flex-shrink-0 mt-0.5 text-[#42c9ad]" />

              <p>
                Your maintenance details will be signed and prepared
                as a QR code for offline record keeping.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold text-white mb-3">
                Facility and technician
              </p>

              <div className="modal-form-grid">
                <div className="modal-field">
                  <label className="field-label">
                    Facility ID
                  </label>

                  <input
                    type="text"
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    className="field-input mono"
                  />
                </div>

                <div className="modal-field">
                  <label className="field-label">
                    Technician ID
                  </label>

                  <input
                    type="text"
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                    className="field-input mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white mb-3">
                Equipment details
              </p>

              <div className="modal-form-grid">
                <div className="modal-field">
                  <label className="field-label">
                    Equipment serial number
                  </label>

                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="field-input mono"
                  />
                </div>

                <div className="modal-field">
                  <label className="field-label">
                    Fault code
                  </label>

                  <input
                    type="text"
                    disabled
                    value={`${blinkCode} ${blinkCode === 1 ? 'flash' : 'flashes'}`}
                    className="field-input mono opacity-60"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="field-label">
                Work carried out
              </label>

              <textarea
                rows={4}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="field-textarea"
                placeholder="Describe the tests and repairs completed..."
              />
            </div>

            <div className="bg-[#0c1421] rounded-xl border border-white/10 p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Equipment being recorded
              </p>

              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold text-white">
                  {compressorModel}
                </span>

                <span className="text-xs mono text-slate-400">
                  {voltage}V · {resistance}Ω
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateSignedLog}
              disabled={loading}
              className="btn-primary w-full !py-3.5"
            >
              {loading ? (
                <span className="loading-ring !w-4 !h-4 !border-2" />
              ) : (
                <QrCode size={18} />
              )}

              <span>
                {loading
                  ? 'Preparing your record...'
                  : 'Sign and generate QR code'}
              </span>
            </button>
          </div>
        ) : (
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#173b43] flex items-center justify-center text-[#42c9ad] mx-auto">
              <ShieldCheck size={27} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Record generated
              </h3>

              <p className="text-xs text-slate-400 mt-2">
                Your maintenance record is ready to save.
              </p>
            </div>

            <div className="inline-block bg-white p-4 rounded-2xl shadow-xl">
              <img
                src={qrDataUrl}
                alt="Maintenance record QR code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-left bg-[#0c1421] border border-white/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={14} className="text-[#42c9ad]" />

                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Digital signature · HMAC-SHA256
                </span>
              </div>

              <p className="text-[10px] mono text-[#42c9ad] break-all leading-relaxed">
                {hash}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataUrl;
                  a.download = `COLDCHAIN-LOG-${Date.now()}.png`;
                  a.click();
                }}
                className="btn-secondary flex-1"
              >
                <Download size={15} />
                Save QR image
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn-primary flex-1"
              >
                <Check size={16} />
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};