import React, { useState } from 'react';
import { X, QrCode, Lock, Download, Check } from 'lucide-react';
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
  const [clinicId, setClinicId] = useState("UNICEF-SSA-CLINIC-409");
  const [technicianId, setTechnicianId] = useState("TECH-MSF-382");
  const [serialNumber, setSerialNumber] = useState("BD35F-883921-X");
  const [correctiveAction, setCorrectiveAction] = useState("Measured stator coils. Disconnected condenser fan to verify start.");
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
          identifiedRootCause: plan?.faultSummary || "Routine Diagnostic",
          correctiveAction
        })
      });
      const data = await response.json();
      if (data.success) {
        setQrDataUrl(data.qrDataUrl);
        setHash(data.hash);
      }
    } catch {
      alert("Error generating encrypted maintenance record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-tactical-900 border border-tactical-700 rounded-lg max-w-xl w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-tactical-700/60 pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-tactical-accent" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Encrypted Offline Maintenance Manifest (HMAC-SHA256)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!qrDataUrl ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">CLINIC FACILITY ID</label>
                <input
                  type="text"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  className="w-full bg-tactical-950 border border-tactical-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">TECHNICIAN BADGE ID</label>
                <input
                  type="text"
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full bg-tactical-950 border border-tactical-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">EQUIPMENT SERIAL #</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-tactical-950 border border-tactical-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">RECORDED BLINK CODE</label>
                <input
                  type="text"
                  disabled
                  value={`${blinkCode} Flash(es)`}
                  className="w-full bg-tactical-950/60 border border-tactical-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">CORRECTIVE ACTIONS TAKEN</label>
              <textarea
                rows={3}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="w-full bg-tactical-950 border border-tactical-700 rounded px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateSignedLog}
              disabled={loading}
              className="w-full bg-tactical-accent hover:bg-amber-600 text-black font-bold text-xs py-2 rounded flex items-center justify-center space-x-2 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>{loading ? "Generating Cryptographic Manifest..." : "Sign & Generate QR Sync Payload"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="bg-white p-3 rounded inline-block shadow-lg">
              <img src={qrDataUrl} alt="Maintenance Log QR" className="w-48 h-48 mx-auto" />
            </div>

            <div className="bg-tactical-950 p-2.5 rounded border border-tactical-800 text-left font-mono text-[10px] space-y-1">
              <div className="text-slate-400">HMAC-SHA256 DIGITAL SIGNATURE:</div>
              <div className="text-emerald-400 break-all">{hash}</div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrDataUrl;
                  a.download = `COLDCHAIN-LOG-${Date.now()}.png`;
                  a.click();
                }}
                className="flex-1 bg-tactical-800 hover:bg-tactical-700 border border-tactical-700 text-white text-xs py-2 rounded flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR Image</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-tactical-accent hover:bg-amber-600 text-black font-bold text-xs py-2 rounded flex items-center justify-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
