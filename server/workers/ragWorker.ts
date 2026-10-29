import Database from 'better-sqlite3';
import path from 'path';

interface RetrievalQuery {
  blinkCode: number;
  voltage: number;
  resistance?: number;
  compressorModel: string;
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'coldchainguard.db');

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0;i < vecA.length;i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

async function runVectorRetrieval(query: RetrievalQuery) {
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

  const queryPrompt = `Compressor fault code ${query.blinkCode} blinks, operating voltage ${query.voltage}V DC, compressor ${query.compressorModel}`;

  try {
    const qvac = await import('@qvac/sdk');
    const modelPath = path.resolve(process.cwd(), 'models', 'bge-small-en-v1.5-q8_0.gguf');

    const modelId = await qvac.loadModel({
      modelType: 'embeddings',
      modelSrc: modelPath,
      modelConfig: { device: 'cpu', threads: 2 }
    });

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

    await qvac.unloadModel({ modelId });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.chunk);
  } catch {
    const targetTag = `blink-${query.blinkCode}`;
    const scored = chunks.map((chunk) => {
      let score = 0;
      const parsedTags: string[] = JSON.parse(chunk.tags);
      if (parsedTags.includes(targetTag)) score += 10.0;
      if (chunk.content.toLowerCase().includes(query.compressorModel.toLowerCase())) score += 3.0;
      if (query.voltage < 10.5 && parsedTags.includes('voltage')) score += 5.0;
      if (query.resistance !== undefined && parsedTags.includes('resistance')) score += 4.0;
      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.chunk);
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
