import { describe, expect, it } from 'vitest';
import {
  acuteChronicWorkloadRatio,
  effectiveSets,
  estimateOneRepMax,
  leanMass,
  movingAverage,
  totalVolume,
  weightedVolume,
} from './calculations.js';

const set = (weightKg: number, reps: number, isWarmup = false, rir: number | null = 2) =>
  ({ weightKg, reps, isWarmup, rir }) as const;

describe('estimateOneRepMax', () => {
  it('devolve a própria carga para uma repetição', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });

  it('usa Brzycki até 10 reps', () => {
    expect(estimateOneRepMax(100, 8)).toBeCloseTo(124.14, 1);
  });

  it('usa Epley acima de 10 reps', () => {
    expect(estimateOneRepMax(100, 15)).toBeCloseTo(150, 1);
  });
});

describe('totalVolume', () => {
  it('ignora séries de aquecimento', () => {
    expect(totalVolume([set(60, 10, true), set(100, 5)])).toBe(500);
  });
});

describe('weightedVolume', () => {
  it('pondera pela ativação muscular', () => {
    expect(weightedVolume([set(100, 10)], 0.4)).toBe(400);
  });
});

describe('effectiveSets', () => {
  it('conta apenas séries próximas da falha', () => {
    expect(effectiveSets([set(100, 8, false, 1), set(100, 8, false, 5)])).toBe(1);
  });
});

describe('leanMass', () => {
  it('deriva massa magra do peso e percentual de gordura', () => {
    expect(leanMass(80, 20)).toBe(64);
  });
});

describe('acuteChronicWorkloadRatio', () => {
  it('devolve null sem carga crônica', () => {
    expect(acuteChronicWorkloadRatio(1000, 0)).toBeNull();
  });

  it('sinaliza salto agudo de carga', () => {
    expect(acuteChronicWorkloadRatio(2000, 4000)).toBe(2);
  });
});

describe('movingAverage', () => {
  it('só produz valor após a janela completa', () => {
    const result = movingAverage([1, 2, 3], 3);
    expect(result[0]).toBeNull();
    expect(result[2]).toBe(2);
  });
});
