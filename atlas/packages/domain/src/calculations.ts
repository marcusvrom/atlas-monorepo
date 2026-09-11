/**
 * Cálculos do domínio de treino. Funções puras, sem dependência de I/O.
 *
 * IMPORTANTE: toda fórmula é VERSIONADA. Resultados históricos não podem mudar
 * quando a fórmula evoluir — um 1RM calculado em 2026 precisa continuar o mesmo
 * em 2029. Ao alterar uma fórmula, crie uma nova versão e mantenha a antiga.
 * Ver spec 00 §11.4.
 */

export const CALCULATION_VERSION = 2 as const;

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
export function weightedVolume(sets: readonly SetInput[], activationWeight: number): number {
  return round2(totalVolume(sets) * clamp(activationWeight, 0, 1));
}

export const DEFAULT_MAX_RIR = 3;

/**
 * Séries efetivas — versão 1. **Não usar em código novo.**
 *
 * Mantida porque a fórmula é versionada (ver o topo deste arquivo): qualquer
 * número já apresentado ou persistido sob a v1 precisa continuar reproduzível.
 * Dois defeitos a condenaram, ambos observados em tela:
 *
 * 1. Exigia RIR registrado. Como RIR é opcional no contrato, quem não anota
 *    reserva via "0 séries efetivas" em todos os grupos musculares — a métrica
 *    lia como "você não treinou" para a maior parte dos usuários reais.
 * 2. Contava série inteira ou nada, sem noção de ativação. Ver
 *    `weightedEffectiveSets`.
 */
export function effectiveSetsV1(sets: readonly SetInput[], maxRir = DEFAULT_MAX_RIR): number {
  return sets.filter((s) => !s.isWarmup && s.rir !== null && s.rir <= maxRir).length;
}

/**
 * Uma série conta como estímulo? — versão 2.
 *
 * Regra: série de aquecimento nunca conta. Série de trabalho conta, **a menos
 * que** exista evidência explícita de que foi leve (RIR registrado acima do
 * limite). RIR ausente conta.
 *
 * Essa última parte é a inversão em relação à v1, e é uma escolha, não um
 * detalhe: RIR é um campo opcional que a maioria não preenche. Tratar ausência
 * como "série fácil" zerava a métrica de quem treina e registra carga e
 * repetição — ou seja, do usuário padrão. Tratar ausência como "série de
 * trabalho" pode superestimar quem faz séries realmente leves sem anotar, e
 * esse é o erro preferível: ele só aparece em quem tem o dado para corrigi-lo.
 */
export function isEffectiveSet(set: SetInput, maxRir = DEFAULT_MAX_RIR): boolean {
  if (set.isWarmup) return false;
  return set.rir === null || set.rir <= maxRir;
}

/**
 * Séries efetivas de um músculo, ponderadas pela ativação — versão 2.
 *
 * O número é **fracionário** de propósito. Um agachamento é uma série efetiva
 * para o quadríceps e cerca de meia para o glúteo; a v1 dava 1 e 0, o que
 * produzia "0 séries efetivas · 25,5 t de carga" para o glúteo de quem só
 * agacha — verdadeiro dentro da definição antiga, e sem sentido para quem lê.
 *
 * O peso vem do próprio `activationWeight` do catálogo (1,0 para o motor
 * primário, 0,4–0,5 para sinergistas), e não de uma tabela nova: a mesma
 * ponderação que alimenta o volume alimenta o estímulo, então as duas medidas
 * nunca se contradizem.
 *
 * A camada de apresentação arredonda; aqui a fração é preservada, porque somar
 * dez meias séries precisa dar cinco, não zero nem dez.
 */
export function weightedEffectiveSets(
  sets: readonly SetInput[],
  activationWeight: number,
  maxRir = DEFAULT_MAX_RIR,
): number {
  const weight = clamp(activationWeight, 0, 1);
  return round2(sets.reduce((total, s) => (isEffectiveSet(s, maxRir) ? total + weight : total), 0));
}

/**
 * Séries efetivas sem ponderação, para quando o recorte já é de um exercício
 * só e a pergunta é "quantas séries de trabalho eu fiz".
 */
export function effectiveSets(sets: readonly SetInput[], maxRir = DEFAULT_MAX_RIR): number {
  return sets.filter((s) => isEffectiveSet(s, maxRir)).length;
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
export function movingAverage(values: readonly number[], window = 7): (number | null)[] {
  return values.map((_, i) => {
    if (i + 1 < window) return null;
    let sum = 0;
    for (let k = i - window + 1; k <= i; k++) sum += values[k] ?? 0;
    return round2(sum / window);
  });
}

/** Tendência linear por semana (regressão de mínimos quadrados). */
export function weeklyTrend(points: readonly { atMs: number; value: number }[]): number | null {
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
