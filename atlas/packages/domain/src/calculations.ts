/**
 * Cálculos do domínio de treino. Funções puras, sem dependência de I/O.
 *
 * IMPORTANTE: toda fórmula é VERSIONADA. Resultados históricos não podem mudar
 * quando a fórmula evoluir — um 1RM calculado em 2026 precisa continuar o mesmo
 * em 2029. Ao alterar uma fórmula, crie uma nova versão e mantenha a antiga.
 * Ver spec 00 §11.4.
 */

export const CALCULATION_VERSION = 1 as const;

export interface SetInput {
  readonly weightKg: number | null;
  readonly reps: number | null;
  readonly isWarmup: boolean;
  readonly rir: number | null;
}

/** Epley — melhor comportamento acima de 10 repetições. */
export function estimateOneRepMaxEpley(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return round2(weightKg * (1 + reps / 30));
}

/** Brzycki — mais preciso até 10 repetições. Indefinido em reps >= 37. */
export function estimateOneRepMaxBrzycki(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0 || reps >= 37) return 0;
  if (reps === 1) return weightKg;
  return round2((weightKg * 36) / (37 - reps));
}

/**
 * Seleção automática de fórmula por faixa de repetição.
 * Usar uma fórmula só em toda a faixa introduz erro sistemático nos extremos.
 */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  return reps <= 10
    ? estimateOneRepMaxBrzycki(weightKg, reps)
    : estimateOneRepMaxEpley(weightKg, reps);
}

/** Tonelagem simples: Σ (carga × reps), excluindo aquecimento. */
export function totalVolume(sets: readonly SetInput[]): number {
  return round2(
    sets.reduce((acc, s) => {
      if (s.isWarmup || s.weightKg === null || s.reps === null) return acc;
      return acc + s.weightKg * s.reps;
    }, 0),
  );
}

/**
 * Volume ponderado por ativação muscular. É o que alimenta o heatmap: não basta
 * saber que o exercício "é de peito", é preciso saber o quanto.
 */
export function weightedVolume(
  sets: readonly SetInput[],
  activationWeight: number,
): number {
  return round2(totalVolume(sets) * clamp(activationWeight, 0, 1));
}

/**
 * Séries efetivas: proximidade da falha é o que gera estímulo hipertrófico.
 * Séries com RIR > 3 contam pouco para hipertrofia e são excluídas.
 */
export function effectiveSets(sets: readonly SetInput[], maxRir = 3): number {
  return sets.filter((s) => !s.isWarmup && s.rir !== null && s.rir <= maxRir).length;
}

/** Massa magra é sempre derivada, nunca informada. */
export function leanMass(weightKg: number, bodyFatPct: number): number {
  return round2(weightKg * (1 - clamp(bodyFatPct, 0, 100) / 100));
}

export function bodyMassIndex(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return round2(weightKg / (m * m));
}

/**
 * Acute:Chronic Workload Ratio — proxy de risco de lesão.
 * Faixa segura usual: 0,8–1,3. Acima de 1,5 indica salto agudo de carga.
 */
export function acuteChronicWorkloadRatio(
  volumeLast7Days: number,
  volumeLast28Days: number,
): number | null {
  if (volumeLast28Days <= 0) return null;
  const chronic = volumeLast28Days / 4;
  if (chronic <= 0) return null;
  return round2(volumeLast7Days / chronic);
}

export function adherenceRate(completed: number, planned: number): number {
  if (planned <= 0) return 0;
  return round2(clamp(completed / planned, 0, 1));
}

/**
 * Média móvel simples. Peso corporal diário é dominado por ruído (hidratação,
 * conteúdo intestinal, glicogênio); plotar o valor cru gera ansiedade e leitura
 * errada da tendência. A UI sempre exibe o suavizado como linha principal.
 */
export function movingAverage(
  values: readonly number[],
  window = 7,
): (number | null)[] {
  return values.map((_, i) => {
    if (i + 1 < window) return null;
    let sum = 0;
    for (let k = i - window + 1; k <= i; k++) sum += values[k] ?? 0;
    return round2(sum / window);
  });
}

/** Tendência linear por semana (regressão de mínimos quadrados). */
export function weeklyTrend(
  points: readonly { atMs: number; value: number }[],
): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const meanX = points.reduce((a, p) => a + p.atMs, 0) / n;
  const meanY = points.reduce((a, p) => a + p.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.atMs - meanX) * (p.value - meanY);
    den += (p.atMs - meanX) ** 2;
  }
  if (den === 0) return null;
  const perMs = num / den;
  return round2(perMs * 7 * 24 * 60 * 60 * 1000);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
