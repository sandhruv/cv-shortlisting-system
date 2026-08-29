/**
 * In-memory vector store with cosine similarity search.
 * Lightweight alternative to FAISS suitable for profile-scale data.
 */

class VectorStore {
  constructor() {
    this.vectors = []; // Float32Array[]
    this.metadata = []; // { text, section, source }
  }

  add(vector, meta) {
    this.vectors.push(vector);
    this.metadata.push(meta);
  }

  addBatch(vectors, metadataList) {
    for (let i = 0; i < vectors.length; i++) {
      this.add(vectors[i], metadataList[i]);
    }
  }

  search(queryVector, topK = 5) {
    if (this.vectors.length === 0) return [];

    const scores = [];
    for (let i = 0; i < this.vectors.length; i++) {
      const score = cosineSimilarity(queryVector, this.vectors[i]);
      scores.push({ index: i, score });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map((s) => ({
      ...this.metadata[s.index],
      score: s.score,
    }));
  }

  searchWithFilter(queryVector, filter, topK = 5) {
    if (this.vectors.length === 0) return [];

    const scores = [];
    for (let i = 0; i < this.vectors.length; i++) {
      const meta = this.metadata[i];
      // Apply filter
      if (filter.section && meta.section !== filter.section) continue;
      if (filter.source && meta.source !== filter.source) continue;

      const score = cosineSimilarity(queryVector, this.vectors[i]);
      scores.push({ index: i, score });
    }

    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map((s) => ({
      ...this.metadata[s.index],
      score: s.score,
    }));
  }

  size() {
    return this.vectors.length;
  }

  clear() {
    this.vectors = [];
    this.metadata = [];
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

module.exports = VectorStore;
