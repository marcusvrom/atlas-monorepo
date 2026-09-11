import { describe, expect, it } from 'vitest';
import {
  acuteChronicWorkloadRatio,
  effectiveSets,
  effectiveSetsV1,
  isEffectiveSet,
  weightedEffectiveSets,
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

describe('séries efetivas', () => {
  it('descarta a série com evidência explícita de que foi leve', () => {
    expect(effectiveSets([set(100, 8, false, 1), set(100, 8, false, 5)])).toBe(1);
  });

  it('nunca conta aquecimento', () => {
    expect(effectiveSets([set(40, 10, true, 0), set(100, 8, false, 2)])).toBe(1);
  });

  it('conta a série de trabalho sem RIR anotado', () => {
    // A v1 exigia RIR e por isso zerava a métrica de quem não anota reserva —
    // ou seja, do usuário padrão. Ver o comentário de `isEffectiveSet`.
    expect(effectiveSets([set(100, 8, false, null), set(100, 8, false, null)])).toBe(2);
    expect(effectiveSetsV1([set(100, 8, false, null)])).toBe(0);
    expect(isEffectiveSet(set(100, 8, false, null))).toBe(true);
    expect(isEffectiveSet(set(100, 8, false, 6))).toBe(false);
    expect(isEffectiveSet(set(40, 10, true, 0))).toBe(false);
  });

  it('respeita um limite de RIR informado pelo chamador', () => {
    expect(effectiveSets([set(100, 8, false, 4)], 5)).toBe(1);
    expect(effectiveSets([set(100, 8, false, 4)], 3)).toBe(0);
  });
});

describe('séries efetivas ponderadas pela ativação', () => {
  const working = [set(100, 8, false, 2), set(100, 8, false, 2), set(100, 8, false, 2)];

  it('dá série inteira ao motor primário', () => {
    expect(weightedEffectiveSets(working, 1)).toBe(3);
  });

  it('dá fração ao sinergista, em vez de zero', () => {
    // O defeito que isto corrige: o glúteo de quem só agacha aparecia com
    // "0 séries efetivas" ao lado de 25 t de carga.
    expect(weightedEffectiveSets(working, 0.45)).toBe(1.35);
    expect(weightedEffectiveSets(working, 0.45)).toBeGreaterThan(0);
  });

  it('soma frações sem perder o total', () => {
    const tenHalves = Array.from({ length: 10 }, () => set(100, 8, false, null));
    expect(weightedEffectiveSets(tenHalves, 0.5)).toBe(5);
  });

  it('mantém a coerência com o volume: ativação zero não gera estímulo', () => {
    expect(weightedEffectiveSets(working, 0)).toBe(0);
    expect(weightedVolume(working, 0)).toBe(0);
  });

  it('trata ativação fora da faixa sem inventar estímulo', () => {
    expect(weightedEffectiveSets(working, 5)).toBe(3);
    expect(weightedEffectiveSets(working, -1)).toBe(0);
  });

  it('não conta aquecimento, qualquer que seja a ativação', () => {
    expect(weightedEffectiveSets([set(40, 10, true, 0)], 1)).toBe(0);
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
