/**
 * TF-IDF based embedding service for profile text chunks.
 * Generates sparse vector representations suitable for cosine similarity search.
 * No external API dependencies - works entirely locally.
 */

function tokenize(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "need", "dare",
  "this", "that", "these", "those", "i", "me", "my", "myself", "we",
  "our", "ours", "ourselves", "you", "your", "yours", "yourself",
  "he", "him", "his", "himself", "she", "her", "hers", "herself",
  "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
  "what", "which", "who", "whom", "when", "where", "why", "how",
  "all", "each", "every", "both", "few", "more", "most", "other",
  "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "just", "because", "if", "then", "else",
  "about", "up", "out", "off", "over", "under", "again", "further",
  "once", "here", "there", "also", "into", "through", "during",
  "before", "after", "above", "below", "between", "same", "being",
  "having", "doing", "saying", "going", "getting", "making", "using",
  "working", "looking", "running", "taking", "coming", "back",
]);

class EmbeddingService {
  constructor() {
    this.vocabulary = new Map(); // word -> index
    this.idf = new Map(); // word -> IDF score
    this.isFitted = false;
  }

  fit(documents) {
    const docCount = documents.length;
    const wordDocFreq = new Map();

    const tokenizedDocs = documents.map((doc) => {
      const tokens = tokenize(doc);
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        wordDocFreq.set(token, (wordDocFreq.get(token) || 0) + 1);
      }
      return tokens;
    });

    let idx = 0;
    for (const [word, df] of wordDocFreq) {
      this.vocabulary.set(word, idx);
      // IDF with smoothing: log((1 + N) / (1 + df)) + 1
      this.idf.set(word, Math.log((1 + docCount) / (1 + df)) + 1);
      idx++;
    }

    this.isFitted = true;
    return tokenizedDocs;
  }

  transform(text) {
    if (!this.isFitted) throw new Error("EmbeddingService must be fitted before transforming");

    const tokens = tokenize(text);
    const vector = new Float32Array(this.vocabulary.size);

    // Term frequency
    const tf = new Map();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // TF-IDF vector
    for (const [word, count] of tf) {
      const idx = this.vocabulary.get(word);
      if (idx !== undefined) {
        const tfScore = 1 + Math.log(count); // log-normalized TF
        const idfScore = this.idf.get(word) || 0;
        vector[idx] = tfScore * idfScore;
      }
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < vector.length; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  fitTransform(documents) {
    this.fit(documents);
    return documents.map((doc) => this.transform(doc));
  }

  cosineSimilarity(a, b) {
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

  getVocabSize() {
    return this.vocabulary.size;
  }
}

module.exports = EmbeddingService;
