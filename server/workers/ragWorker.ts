import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface RetrievalQuery {
  blinkCode: number;
  voltage: number;
  resistance?: number;
  compressorModel: string;
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'coldchainguard.db');

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

async function runVectorRetrieval(query: RetrievalQuery) {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found at ${DB_PATH}. Run initDatabase() first.`);
  }

  const modelPath = path.resolve(process.cwd(), 'models', 'bge-small-en-v1.5-q8_0.gguf');
  if (!fs.existsSync(modelPath)) {
    throw new Error(`Embedding model not found at ${modelPath}. Place 'bge-small-en-v1.5-q8_0.gguf' in the models/ directory.`);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const chunks = db.prepare('SELECT id, category, title, source, content, tags FROM who_manual_chunks').all() as Array<{
    id: string;
    category: string;
    title: string;
    source: string;
    content: string;
    tags: string;
  }>;
  db.close();

  if (chunks.length === 0) {
    throw new Error("No reference WHO manual chunks found in the database.");
  }

  const queryPrompt = `Secop ${query.compressorModel} blink code ${query.blinkCode} flashes, voltage ${query.voltage}V DC${query.resistance ? `, winding resistance ${query.resistance} Ohms` : ''}`;

  const qvac = await import('@qvac/sdk');

  const modelId = await (qvac as any).loadModel({
    modelType: 'embeddings',
    modelSrc: modelPath,
    modelConfig: { device: 'cpu' }
  });

  try {
    const { embedding: queryVector } = await qvac.embed({
      modelId,
      text: queryPrompt
    });

    const scored = await Promise.all(
      chunks.map(async (chunk) => {
        const { embedding: chunkVector } = await qvac.embed({
          modelId,
          text: `${chunk.title}: ${chunk.content}`
        });
        const similarity = cosineSimilarity(queryVector, chunkVector);
        return { chunk, score: similarity };
      })
    );

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.chunk);
  } finally {
    await qvac.unloadModel({ modelId });
  }
}

process.on('message', async (query: RetrievalQuery) => {
  try {
    const results = await runVectorRetrieval(query);
    if (process.send) {
      process.send({ success: true, results });
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