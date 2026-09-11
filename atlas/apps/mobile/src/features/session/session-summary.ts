import type { TrainingSession } from '@atlas/contracts';
import { estimateOneRepMax } from '@atlas/domain';
export function sessionRecords(session: TrainingSession, previous: TrainingSession | null) {
  if (!previous) return [];
  const best = new Map<string, number>();
  for (const set of previous.sets) {
    if (set.weightKg !== null && set.reps !== null && !set.isWarmup)
      best.set(
        set.exerciseId,
        Math.max(best.get(set.exerciseId) ?? 0, estimateOneRepMax(set.weightKg, set.reps)),
      );
  }
  const records = new Set<string>();
  for (const set of session.sets) {
    if (
      set.weightKg !== null &&
      set.reps !== null &&
      !set.isWarmup &&
      best.has(set.exerciseId) &&
      estimateOneRepMax(set.weightKg, set.reps) > best.get(set.exerciseId)!
    )
      records.add(set.exerciseId);
  }
  return [...records];
}
export function remainingRest(deadline: number, now: number) {
  'worklet';
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/**
 * ATL-SES-005 — recordes DURANTE a sessão.
 *
 * `sessionRecords` acima responde "quais exercícios tiveram recorde" e serve ao
 * resumo. Aqui a pergunta é outra e mais difícil: **qual série exatamente** foi
 * o recorde, para a tela poder marcar aquela linha no momento em que ela
 * acontece. O pico emocional de um app de treino é o recorde acontecendo, não
 * um número contado no fim.
 *
 * A regra tem uma sutileza que vale escrever: uma série só é recorde se bater a
 * melhor da sessão anterior **e** for a melhor até agora nesta sessão. Sem a
 * segunda condição, uma série de recuperação depois do recorde receberia o selo
 * também, e três séries seguidas marcadas como "recorde" não significam nada.
 */
export function previousBestOneRepMax(
  previous: TrainingSession | null,
  exerciseId: string,
): number {
  if (!previous) return 0;
  let best = 0;
  for (const set of previous.sets) {
    if (set.exerciseId !== exerciseId || set.isWarmup) continue;
    if (set.weightKg === null || set.reps === null) continue;
    best = Math.max(best, estimateOneRepMax(set.weightKg, set.reps));
  }
  return best;
}

/** Ids das séries desta sessão que são recorde. Vazio sem base de comparação. */
export function recordSetIds(
  session: TrainingSession,
  previous: TrainingSession | null,
): Set<string> {
  const records = new Set<string>();
  if (!previous) return records;

  // Melhor corrente por exercício: começa na marca da sessão anterior e sobe
  // conforme as séries desta sessão a superam.
  const running = new Map<string, number>();
  for (const set of session.sets) {
    if (set.isWarmup || set.weightKg === null || set.reps === null) continue;
    const base =
      running.get(set.exerciseId) ?? previousBestOneRepMax(previous, set.exerciseId);
    // Sem base não há recorde: primeira vez executando o exercício não é PR.
    if (base <= 0) {
      running.set(set.exerciseId, estimateOneRepMax(set.weightKg, set.reps));
      continue;
    }
    const estimate = estimateOneRepMax(set.weightKg, set.reps);
    if (estimate > base) {
      records.add(set.clientGeneratedId);
      running.set(set.exerciseId, estimate);
    } else {
      running.set(set.exerciseId, base);
    }
  }
  return records;
}
