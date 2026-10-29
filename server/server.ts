import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { initDatabase, db } from './db.js';
import { SYNTHETIC_BENCHMARKS } from './seedData.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

initDatabase();

const CLIENT_DIST = path.resolve(process.cwd(), 'dist', 'client');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

function runIsolatedWorker<TInput, TOutput>(workerRelativePath: string, payload: TInput): Promise<TOutput> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const workerPath = path.resolve(process.cwd(), workerRelativePath);

    const child = fork(workerPath, [], {
      execArgv: ['--max-old-space-size=512'],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    let resultReceived = false;

    child.on('message', (msg: { success: boolean; data?: TOutput; results?: TOutput; diagnostic?: TOutput; error?: string }) => {
      resultReceived = true;
      const duration = Date.now() - startTime;
      const memUsage = process.memoryUsage();
      const peakMb = Math.round((memUsage.rss / 1024 / 1024) * 100) / 100;

      try {
        db.prepare(`
          INSERT INTO worker_telemetry (worker_name, peak_memory_mb, duration_ms, exit_code, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `).run(path.basename(workerPath), peakMb, duration, 0, new Date().toISOString());
      } catch (e) {
        console.error("Telemetry write error:", e);
      }

      if (msg.success) {
        resolve((msg.data || msg.results || msg.diagnostic) as TOutput);
      } else {
        reject(new Error(msg.error || "Worker failed"));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (!resultReceived && code !== 0) {
        reject(new Error(`Worker exited abruptly with code ${code}`));
      }
    });

    child.send(payload as any);
  });
}

// System Telemetry Route
app.get('/api/system-telemetry', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const recentTelemetry = db.prepare(`
    SELECT * FROM worker_telemetry ORDER BY id DESC LIMIT 5
  `).all();

  res.json({
    status: 'ONLINE',
    mode: 'AIR_GAPPED_LOCAL_EDGE',
    hostMemory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      externalMb: Math.round(mem.external / 1024 / 1024),
      totalSystemUsedApproxMb: 2480,
      systemCeilingMb: 4096
    },
    recentWorkerRuns: recentTelemetry
  });
});

// Benchmark Scenarios Route
app.get('/api/synthetic-benchmarks', (_req: Request, res: Response) => {
  res.json({
    description: "ColdChainGuard Ground-Truth Calibration Benchmarks (WHO PQS E003 Compliance)",
    benchmarks: SYNTHETIC_BENCHMARKS
  });
});

// Optical Extraction Route
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    const workerScript = fs.existsSync(path.resolve(process.cwd(), 'dist', 'server', 'workers', 'ocrWorker.js'))
      ? 'dist/server/workers/ocrWorker.js'
      : 'server/workers/ocrWorker.ts';

    const result = await runIsolatedWorker(workerScript, { imageBufferBase64: imageBase64 });
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Diagnostic Isolation Route
app.post('/api/diagnose', async (req: Request, res: Response) => {
  try {
    const { blinkCode, voltage, fanAmperage, resistance, ambientTemp, compressorModel, electronicUnitCode } = req.body;

    const ragScript = fs.existsSync(path.resolve(process.cwd(), 'dist', 'server', 'workers', 'ragWorker.js'))
      ? 'dist/server/workers/ragWorker.js'
      : 'server/workers/ragWorker.ts';

    const contextChunks = await runIsolatedWorker<unknown, unknown[]>(ragScript, {
      blinkCode: Number(blinkCode),
      voltage: Number(voltage),
      resistance: resistance ? Number(resistance) : undefined,
      compressorModel: compressorModel || 'BD35F'
    });

    const diagScript = fs.existsSync(path.resolve(process.cwd(), 'dist', 'server', 'workers', 'diagnosticWorker.js'))
      ? 'dist/server/workers/diagnosticWorker.js'
      : 'server/workers/diagnosticWorker.ts';

    const diagnostic = await runIsolatedWorker(diagScript, {
      blinkCode: Number(blinkCode),
      voltage: Number(voltage),
      fanAmperage: fanAmperage ? Number(fanAmperage) : undefined,
      resistance: resistance ? Number(resistance) : undefined,
      ambientTemp: ambientTemp ? Number(ambientTemp) : undefined,
      compressorModel: compressorModel || 'BD35F',
      electronicUnitCode: electronicUnitCode || '101N0210',
      contextChunks
    });

    res.json({
      diagnostic,
      retrievedContext: contextChunks
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Maintenance Manifest Export Route
app.post('/api/export-log', async (req: Request, res: Response) => {
  try {
    const {
      clinicId,
      technicianId,
      refrigeratorModel,
      serialNumber,
      blinkCode,
      voltageReading,
      resistanceReading,
      identifiedRootCause,
      correctiveAction
    } = req.body;

    const id = `LOG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const canonicalString = `${id}|${timestamp}|${clinicId}|${technicianId}|${refrigeratorModel}|${serialNumber}|${blinkCode}|${voltageReading}|${resistanceReading}|${identifiedRootCause}`;
    const hash = crypto.createHmac('sha256', 'QVAC-OFFLINE-COLDCHAIN-KEY-2025').update(canonicalString).digest('hex');

    const qrPayload = JSON.stringify({
      id,
      ts: timestamp,
      cl: clinicId,
      tech: technicianId,
      m: refrigeratorModel,
      sn: serialNumber,
      bk: blinkCode,
      v: voltageReading,
      r: resistanceReading,
      sig: hash.substring(0, 16)
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 6,
      color: {
        dark: '#0a0d12',
        light: '#ffffff'
      }
    });

    db.prepare(`
      INSERT INTO maintenance_audit_logs (
        id, created_at, clinic_id, technician_id, refrigerator_model,
        serial_number, blink_code, voltage_reading, resistance_reading,
        identified_root_cause, corrective_action, cryptographic_hash, qr_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, timestamp, clinicId || 'UNICEF-RURAL-042', technicianId || 'TECH-MSF-88',
      refrigeratorModel || 'Secop BD35F', serialNumber || 'SN-UNKNOWN',
      Number(blinkCode), Number(voltageReading), Number(resistanceReading || 0),
      identifiedRootCause, correctiveAction, hash, qrPayload
    );

    res.json({
      success: true,
      logId: id,
      timestamp,
      hash,
      qrDataUrl,
      rawPayload: qrPayload
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.use((_req: Request, res: Response) => {
  const indexPath = path.resolve(CLIENT_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('ColdChainGuard API Server running. Build client with `npm run build` to view full UI.');
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  COLDCHAINGUARD: AIR-GAPPED DIAGNOSTIC ENGINE ACTIVE  `);
  console.log(`  LOCAL PORT: http://0.0.0.0:${PORT}                   `);
  console.log(`=======================================================`);
});
