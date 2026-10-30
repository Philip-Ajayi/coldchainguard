import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

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
    setScanStatus("Analyzing nameplate with native GGML OCR worker...");
    setScanError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Payload })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Optical scan failed`);
      }

      if (data.detectedModel && data.detectedModel !== 'Unidentified Model') {
        onModelChange(data.detectedModel, data.electronicUnitCode);
        setScanStatus(`Identified: ${data.detectedBrand} ${data.detectedModel} (${data.electronicUnitCode}) - Confidence: ${Math.round(data.confidenceScore * 100)}%`);
      } else {
        setScanError(`OCR Text Extracted ("${data.rawText.slice(0, 40)}..."), but could not match known compressor models. Please select manually.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      setScanStatus(null);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result?.toString() || '';
        const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        processImageBuffer(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-tactical-900 border border-tactical-700/60 rounded-lg p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-tactical-700/50 pb-2">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Compressor Nameplate OCR
          </h2>
        </div>
        <div className="flex items-center space-x-2">
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
            className="bg-tactical-800 hover:bg-tactical-700 disabled:opacity-50 border border-tactical-700 text-xs text-slate-200 px-3 py-1 rounded flex items-center space-x-1.5 transition"
          >
            {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-tactical-accent" /> : <Camera className="w-3.5 h-3.5" />}
            <span>{scanning ? "Extracting..." : "Capture Photo / File"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">COMPRESSOR SERIES</span>
          <div className="flex items-center space-x-2">
            <select
              value={detectedModel}
              onChange={(e) => onModelChange(e.target.value, electronicUnit)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none"
            >
              <option value="BD35F">Secop / Danfoss BD35F (Standard SDD)</option>
              <option value="BD50F">Secop / Danfoss BD50F (High Capacity)</option>
              <option value="TCW40">B Medical Systems TCW 40 SDD</option>
              <option value="TCX200">Dometic TCX 200 Solar Direct</option>
            </select>
          </div>
        </div>

        <div className="bg-tactical-950 p-2.5 rounded border border-tactical-700">
          <span className="text-[11px] font-mono text-slate-400 block mb-1">ELECTRONIC UNIT CODE</span>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={electronicUnit}
              onChange={(e) => onModelChange(detectedModel, e.target.value)}
              className="w-full bg-tactical-900 border border-tactical-700 rounded px-2.5 py-1.5 font-mono text-sm text-white focus:outline-none"
              placeholder="101N0210"
            />
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </div>
        </div>
      </div>

      {scanStatus && (
        <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{scanStatus}</span>
        </div>
      )}

      {scanError && (
        <div className="mt-2 text-xs font-mono text-red-400 flex items-start space-x-1.5 bg-red-950/40 p-2 rounded border border-red-900">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{scanError}</span>
        </div>
      )}
    </div>
  );
};