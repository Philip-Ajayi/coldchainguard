import fs from 'fs';
import path from 'path';

interface OCRWorkerPayload {
  imagePath?: string;
  imageBufferBase64?: string;
}

interface OCRResult {
  rawText: string;
  detectedBrand: string;
  detectedModel: string;
  electronicUnitCode: string;
  confidenceScore: number;
  engineUsed: 'QVAC_GGML_NATIVE';
}

function parseNameplateText(text: string): { brand: string; model: string; unitCode: string; confidence: number } {
  const clean = text.toUpperCase();

  let brand = 'Unknown Manufacturer';
  let model = 'Unidentified Model';
  let unitCode = 'Unidentified Controller';
  let matchHits = 0;

  // Compressor model patterns
  if (clean.includes('BD35F') || clean.includes('BD35') || clean.includes('101Z0200')) {
    brand = 'Secop / Danfoss';
    model = 'BD35F';
    matchHits += 3;
  } else if (clean.includes('BD50F') || clean.includes('BD50') || clean.includes('101Z0203')) {
    brand = 'Secop / Danfoss';
    model = 'BD50F';
    matchHits += 3;
  } else if (clean.includes('TCW40') || clean.includes('TCW 40') || clean.includes('B MEDICAL')) {
    brand = 'B Medical Systems';
    model = 'TCW 40 SDD';
    matchHits += 3;
  } else if (clean.includes('TCX200') || clean.includes('TCX 200') || clean.includes('DOMETIC')) {
    brand = 'Dometic';
    model = 'TCX 200';
    matchHits += 3;
  }

  // Electronic unit controller patterns
  const unitMatch = clean.match(/101N\d{4}/);
  if (unitMatch) {
    unitCode = unitMatch[0];
    matchHits += 2;
  } else if (model === 'BD35F') {
    unitCode = '101N0210';
  } else if (model === 'BD50F') {
    unitCode = '101N0220';
  }

  // Electrical parameter patterns
  if (clean.includes('12V') || clean.includes('24V') || clean.includes('12-24V') || clean.includes('DC')) {
    matchHits += 1;
  }

  const confidence = Math.min(0.99, Math.max(0.20, matchHits * 0.18));
  return { brand, model, unitCode, confidence };
}

async function runOcrWithQVAC(payload: OCRWorkerPayload): Promise<OCRResult> {
  let imageBuffer: Buffer;

  if (payload.imageBufferBase64) {
    imageBuffer = Buffer.from(payload.imageBufferBase64, 'base64');
  } else if (payload.imagePath && fs.existsSync(payload.imagePath)) {
    imageBuffer = fs.readFileSync(payload.imagePath);
  } else {
    throw new Error("OCR Worker Error: No valid image buffer or file path provided.");
  }

  if (imageBuffer.length === 0) {
    throw new Error("OCR Worker Error: Received empty image buffer.");
  }

  const modelPath = path.resolve(process.cwd(), 'models', 'ocr-latin.gguf');
  if (!fs.existsSync(modelPath)) {
    throw new Error(`OCR Model file not found at ${modelPath}. Place 'ocr-latin.gguf' in the models/ directory.`);
  }

  const qvac = await import('@qvac/sdk');

  const modelId = await qvac.loadModel({
    modelSrc: modelPath,
    modelType: 'ggml-ocr',
    modelConfig: {
      langList: ['en'],
      contrastRetry: true,
      lowConfidenceThreshold: 0.35
    }
  });

  try {
    const ocrResult = qvac.ocr({
      modelId,
      image: imageBuffer as any
    });

    if (!ocrResult || !ocrResult.blocks) {
      throw new Error("OCR Worker Error: Engine failed to produce text blocks from image.");
    }

    const blocks = await ocrResult.blocks;
    const rawText = blocks.map((b: { text: string }) => b.text).join(' ').trim();

    if (!rawText) {
      throw new Error("OCR Worker Error: No recognizable text found on nameplate image. Ensure proper lighting and focus.");
    }

    const parsed = parseNameplateText(rawText);

    return {
      rawText,
      detectedBrand: parsed.brand,
      detectedModel: parsed.model,
      electronicUnitCode: parsed.unitCode,
      confidenceScore: parsed.confidence,
      engineUsed: 'QVAC_GGML_NATIVE'
    };
  } finally {
    await qvac.unloadModel({ modelId });
  }
}

process.on('message', async (message: OCRWorkerPayload) => {
  try {
    const result = await runOcrWithQVAC(message);
    if (process.send) {
      process.send({ success: true, data: result });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (process.send) {
      process.send({ success: false, error: errorMsg });
    }
  } finally {
    process.exit(0);
  }
});