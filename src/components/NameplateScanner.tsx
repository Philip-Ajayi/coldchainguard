import React, { useRef, useState } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Cpu,
} from 'lucide-react';

interface NameplateScannerProps {
  detectedModel: string;
  electronicUnit: string;
  onModelChange: (model: string, unit: string) => void;
}

export const NameplateScanner: React.FC<NameplateScannerProps> = ({
  detectedModel,
  electronicUnit,
  onModelChange,
}) => {
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageBuffer = async (base64Payload: string) => {
    setScanning(true);
    setScanStatus('Reading the equipment label...');
    setScanError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `HTTP ${response.status}: Optical scan failed`
        );
      }

      if (
        data.detectedModel &&
        data.detectedModel !== 'Unidentified Model'
      ) {
        onModelChange(
          data.detectedModel,
          data.electronicUnitCode
        );

        setScanStatus(
          `Found ${data.detectedBrand} ${data.detectedModel} (${data.electronicUnitCode}) · ${Math.round(data.confidenceScore * 100)}% confidence`
        );
      } else {
        setScanError(
          `We couldn't match this label to a known compressor. Please select the model manually.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      setScanStatus(null);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const resultStr = reader.result?.toString() || '';
        const base64 = resultStr.includes(',')
          ? resultStr.split(',')[1]
          : resultStr;

        processImageBuffer(base64);
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <section className="section-card">
      <div className="section-heading">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#173b43] flex items-center justify-center text-[#42c9ad]">
            <ScanLine size={20} />
          </div>

          <div>
            <h2 className="section-title">Equipment details</h2>
            <p className="section-description">
              Identify the refrigerator and its controller.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 rounded-xl bg-[#0c1421] border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1c2b3e] flex items-center justify-center text-slate-300">
              <Cpu size={19} />
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                Current compressor
              </p>
              <p className="text-sm font-bold text-white mt-1">
                {detectedModel}
              </p>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="btn-secondary !px-3 !py-2"
          >
            {scanning ? (
              <RefreshCw
                size={15}
                className="animate-spin text-amber-400"
              />
            ) : (
              <Camera size={15} />
            )}

            <span>
              {scanning ? 'Reading...' : 'Scan label'}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="compressor-model">
            Compressor model
          </label>

          <select
            id="compressor-model"
            value={detectedModel}
            onChange={(e) =>
              onModelChange(e.target.value, electronicUnit)
            }
            className="field-select"
          >
            <option value="BD35F">
              Secop / Danfoss BD35F
            </option>
            <option value="BD50F">
              Secop / Danfoss BD50F
            </option>
            <option value="TCW40">
              B Medical Systems TCW 40 SDD
            </option>
            <option value="TCX200">
              Dometic TCX 200 Solar Direct
            </option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="electronic-unit">
            Electronic controller
          </label>

          <div className="relative">
            <input
              id="electronic-unit"
              type="text"
              value={electronicUnit}
              onChange={(e) =>
                onModelChange(detectedModel, e.target.value)
              }
              className="field-input mono !pr-11"
              placeholder="101N0210"
            />

            <CheckCircle2
              size={17}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#42c9ad]"
            />
          </div>
        </div>
      </div>

      {scanStatus && (
        <div className="scanner-status mt-4">
          <CheckCircle2
            size={16}
            className="flex-shrink-0 mt-0.5"
          />
          <span>{scanStatus}</span>
        </div>
      )}

      {scanError && (
        <div className="scanner-status scanner-error mt-4">
          <AlertCircle
            size={16}
            className="flex-shrink-0 mt-0.5"
          />
          <span>{scanError}</span>
        </div>
      )}
    </section>
  );
};