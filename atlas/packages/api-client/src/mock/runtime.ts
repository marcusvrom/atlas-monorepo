import { ApiError } from '../errors.js';

export interface MockRuntimeConfig {
  /** Latência base em ms. Jitter de ±40% é aplicado automaticamente. */
  latencyMs: number;
  /** 0..1 — probabilidade de injetar falha de rede. */
  errorRate: number;
  /** Seed do gerador determinístico. Toda demo é idêntica. */
  seed: number;
  plan?: 'free'|'pro';
  role?: 'athlete'|'professional';
  clientCount?:24|60;
}

export const defaultMockConfig: MockRuntimeConfig = {
  latencyMs: 220,
  errorRate: 0,
  seed: 20260909,
};

/**
 * Simula condição real de rede. Sem isso, a UI de loading/erro/vazio nunca é
 * construída de verdade e aparece improvisada na integração. Ver spec 12 §3.
 */
export async function simulate<T>(config: MockRuntimeConfig, produce: () => T): Promise<T> {
  const jitter = 1 + (Math.random() - 0.5) * 0.8;
  const delay = Math.max(0, Math.round(config.latencyMs * jitter));
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (config.errorRate > 0 && Math.random() < config.errorRate) {
    throw new ApiError('network', 'Falha de rede simulada (modo mock)');
  }
  return produce();
}

/** PRNG determinístico (mulberry32) — mesma seed, mesma demo, sempre. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uuidV4From(random: () => number): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-';
    else if (i === 14) out += '4';
    else if (i === 19) out += hex[(Math.floor(random() * 16) & 0x3) | 0x8];
    else out += hex[Math.floor(random() * 16)];
  }
  return out;
}
