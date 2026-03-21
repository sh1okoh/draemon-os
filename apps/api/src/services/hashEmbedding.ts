const DIMENSION = 256;

function normalize(value: number[]): number[] {
  const norm = Math.sqrt(value.reduce((sum, current) => sum + current * current, 0)) || 1;
  return value.map((entry) => entry / norm);
}

export function createHashEmbedding(text: string): number[] {
  const vector = new Array<number>(DIMENSION).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    let hash = 2166136261;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    const bucket = Math.abs(hash) % DIMENSION;
    vector[bucket] += 1;
  }

  return normalize(vector);
}

export function toPgVectorLiteral(values: number[]): string {
  return `[${values.map((value) => Number(value.toFixed(6))).join(',')}]`;
}
