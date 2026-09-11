import { describe, expect, it } from 'vitest';
import { TrainingSession } from '@atlas/contracts';
import { previousBestOneRepMax, recordSetIds, sessionRecords } from './session-summary';

const EXERCISE = '018f0000-0000-7000-8000-000000000001';
const OTHER = '018f0000-0000-7000-8000-000000000002';

let counter = 0;
const set = (weightKg: number, reps: number, extra: Record<string, unknown> = {}) => ({
  clientGeneratedId: '018f0000-0000-7000-8000-0000000' + String(counter++).padStart(5, '0'),
  exerciseId: EXERCISE,
  order: 1,
  weightKg,
  reps,
  durationSeconds: null,
  rpe: null,
  rir: 2,
  isWarmup: false,
  painLevel: null,
  performedAt: '2026-09-11T10:00:00.000Z',
  ...extra,
});

const session = (sets: unknown[]) =>
  TrainingSession.parse({
    id: '018f0000-0000-7000-8000-00000000ffff',
    planId: null,
    planVersion: null,
    dayLabel: 'Legs',
    status: 'inProgress',
    startedAt: '2026-09-11T10:00:00.000Z',
    completedAt: null,
    durationSeconds: 0,
    totalVolumeKg: 0,
    sets,
  });

describe('recorde durante a sessão', () => {
  it('não inventa recorde sem sessão anterior', () => {
    expect(recordSetIds(session([set(100, 5)]), null).size).toBe(0);
  });

  it('não marca recorde na primeira vez que o exercício é executado', () => {
    // Sessão anterior existe, mas não tem este exercício: não há o que bater.
    const previous = session([set(60, 10, { exerciseId: OTHER })]);
    expect(recordSetIds(session([set(200, 10)]), previous).size).toBe(0);
  });

  it('marca a série que supera a melhor da sessão anterior', () => {
    const previous = session([set(80, 8)]);
    const current = session([set(85, 8)]);
    expect(recordSetIds(current, previous).has(current.sets[0]!.clientGeneratedId)).toBe(true);
  });

  it('não marca série que fica abaixo da marca anterior', () => {
    const previous = session([set(100, 8)]);
    expect(recordSetIds(session([set(80, 8)]), previous).size).toBe(0);
  });

  it('marca só a série de recuperação nenhuma — a segunda abaixo não é recorde', () => {
    const previous = session([set(80, 8)]);
    const current = session([set(90, 8), set(85, 8)]);
    const records = recordSetIds(current, previous);
    expect(records.has(current.sets[0]!.clientGeneratedId)).toBe(true);
    expect(records.has(current.sets[1]!.clientGeneratedId)).toBe(false);
  });

  it('marca a segunda quando ela supera a primeira', () => {
    const previous = session([set(80, 8)]);
    const current = session([set(85, 8), set(95, 8)]);
    expect(recordSetIds(current, previous).size).toBe(2);
  });

  it('ignora aquecimento', () => {
    const previous = session([set(80, 8)]);
    const current = session([set(200, 8, { isWarmup: true })]);
    expect(recordSetIds(current, previous).size).toBe(0);
  });

  it('lê a melhor marca anterior do exercício certo', () => {
    const previous = session([set(80, 8), set(300, 8, { exerciseId: OTHER })]);
    expect(previousBestOneRepMax(previous, EXERCISE)).toBeLessThan(120);
    expect(previousBestOneRepMax(previous, OTHER)).toBeGreaterThan(300);
  });

  it('continua concordando com o resumo sobre quais exercícios tiveram recorde', () => {
    const previous = session([set(80, 8)]);
    const current = session([set(90, 8)]);
    expect(sessionRecords(current, previous)).toEqual([EXERCISE]);
    expect(recordSetIds(current, previous).size).toBe(1);
  });
});
