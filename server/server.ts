import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fork } from 'child_process';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { initDatabase, db } from './db.js';
import { SYNTHETIC_BENCHMARKS } from './seedData.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

initDatabase();

const CLIENT_DIST = path.resolve(process.cwd(), 'dist', 'client');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
}

function getLiveSystemMemory(): { totalSystemUsedMb: number; systemCeilingMb: number } {
  // Check for Linux cgroups v2 (modern Docker)
  try {
    if (fs.existsSync('/sys/fs/cgroup/memory.current') && fs.existsSync('/sys/fs/cgroup/memory.max')) {
      const currentBytes = parseInt(fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim(), 10);
      const maxStr = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
      const maxBytes = maxStr === 'max' ? os.totalmem() : parseInt(maxStr, 10);

      if (!isNaN(currentBytes) && !isNaN(maxBytes)) {
        return {
          totalSystemUsedMb: Math.round(currentBytes / (1024 * 1024)),
          systemCeilingMb: Math.round(maxBytes / (1024 * 1024))
        };
      }
    }
  } catch {
    // Continue to cgroups v1 / OS fallback
  }

  // Check for Linux cgroups v1
  try {
    const usagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes';
    const limitPath = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
    if (fs.existsSync(usagePath) && fs.existsSync(limitPath)) {
      const currentBytes = parseInt(fs.readFileSync(usagePath, 'utf8').trim(), 10);
      const limitBytes = parseInt(fs.readFileSync(limitPath, 'utf8').trim(), 10);
      if (!isNaN(currentBytes) && !isNaN(limitBytes) && limitBytes < os.totalmem()) {
        return {
          totalSystemUsedMb: Math.round(currentBytes / (1024 * 1024)),
          systemCeilingMb: Math.round(limitBytes / (1024 * 1024))
        };
      }
    }
  } catch {
    // Continue to host OS fallback
  }

  // Host OS live memory fallback
  const total = os.totalmem();
  const free = os.freemem();
  return {
    totalSystemUsedMb: Math.round((total - free) / (1024 * 1024)),
    systemCeilingMb: Math.round(total / (1024 * 1024))
  };
}

function runIsolatedWorker<TInput, TOutput>(workerRelativePath: string, payload: TInput): Promise<TOutput> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const workerPath = path.resolve(process.cwd(), workerRelativePath);

    if (!fs.existsSync(workerPath)) {
      return reject(new Error(`Worker script not found at resolved path: ${workerPath}`));
    }

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
        `).run(path.basename(workerPath), peakMb, duration, msg.success ? 0 : 1, new Date().toISOString());
      } catch (e) {
        console.error("Telemetry write error:", e);
      }

      if (msg.success) {
        resolve((msg.data ?? msg.results ?? msg.diagnostic) as TOutput);
      } else {
        reject(new Error(msg.error || "Worker execution failed"));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (!resultReceived && code !== 0) {
        reject(new Error(`Worker process terminated unexpectedly with exit code ${code}`));
      }
    });

    child.send(payload as any);
  });
}

// Live System Telemetry Route
app.get('/api/system-telemetry', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const liveSystem = getLiveSystemMemory();

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
      totalSystemUsedApproxMb: liveSystem.totalSystemUsedMb,
      systemCeilingMb: liveSystem.systemCeilingMb
    },
    recentWorkerRuns: recentTelemetry
  });
});

// Ground-Truth Calibration Benchmarks Route
app.get('/api/synthetic-benchmarks', (_req: Request, res: Response) => {
  res.json({
    description: "ColdChainGuard Ground-Truth Calibration Benchmarks (WHO PQS E003 Compliance)",
    benchmarks: SYNTHETIC_BENCHMARKS
  });
});

// Optical Character Recognition Route
app.post('/api/ocr', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
      res.status(400).json({ error: "Missing or invalid imageBase64 payload" });
      return;
    }

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

// Diagnostic Engine Route
app.post('/api/diagnose', async (req: Request, res: Response) => {
  try {
    const { blinkCode, voltage, fanAmperage, resistance, ambientTemp, compressorModel, electronicUnitCode } = req.body;

    if (blinkCode === undefined || isNaN(Number(blinkCode))) {
      res.status(400).json({ error: "Valid blinkCode is required" });
      return;
    }
    if (voltage === undefined || isNaN(Number(voltage))) {
      res.status(400).json({ error: "Valid voltage measurement is required" });
      return;
    }

    const ragScript = fs.existsSync(path.resolve(process.cwd(), 'dist', 'server', 'workers', 'ragWorker.js'))
      ? 'dist/server/workers/ragWorker.js'
      : 'server/workers/ragWorker.ts';

    const contextChunks = await runIsolatedWorker<unknown, unknown[]>(ragScript, {
      blinkCode: Number(blinkCode),
      voltage: Number(voltage),
      resistance: resistance !== undefined && !isNaN(Number(resistance)) ? Number(resistance) : undefined,
      compressorModel: compressorModel || 'BD35F'
    });

    const diagScript = fs.existsSync(path.resolve(process.cwd(), 'dist', 'server', 'workers', 'diagnosticWorker.js'))
      ? 'dist/server/workers/diagnosticWorker.js'
      : 'server/workers/diagnosticWorker.ts';

    const diagnostic = await runIsolatedWorker(diagScript, {
      blinkCode: Number(blinkCode),
      voltage: Number(voltage),
      fanAmperage: fanAmperage !== undefined && !isNaN(Number(fanAmperage)) ? Number(fanAmperage) : undefined,
      resistance: resistance !== undefined && !isNaN(Number(resistance)) ? Number(resistance) : undefined,
      ambientTemp: ambientTemp !== undefined && !isNaN(Number(ambientTemp)) ? Number(ambientTemp) : undefined,
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

// Cryptographic Maintenance Manifest Export Route
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

    if (!clinicId || !technicianId || !serialNumber || !identifiedRootCause) {
      res.status(400).json({ error: "Missing required fields: clinicId, technicianId, serialNumber, identifiedRootCause" });
      return;
    }

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
      bk: Number(blinkCode),
      v: Number(voltageReading),
      r: Number(resistanceReading || 0),
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
      id, timestamp, clinicId, technicianId,
      refrigeratorModel || 'Secop BD35F', serialNumber,
      Number(blinkCode), Number(voltageReading), Number(resistanceReading || 0),
      identifiedRootCause, correctiveAction || '', hash, qrPayload
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
    res.status(503).send('ColdChainGuard UI assets not built. Run `npm run build` to generate production frontend.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  COLDCHAINGUARD: LIVE ENGINE ACTIVE                   `);
  console.log(`  ENDPOINT: http://0.0.0.0:${PORT}                     `);
  console.log(`=======================================================`);
});