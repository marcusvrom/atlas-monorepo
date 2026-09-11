import type { ExercisePrescription } from '@atlas/contracts';
import { t } from '../../i18n';

/**
 * Resumo de uma prescrição em rótulos curtos, prontos para chip.
 *
 * Vive fora dos componentes porque a mesma regra é lida em três lugares — a
 * linha da ficha, o card do trilho de hoje e a tela do dia — e porque a regra
 * tem um limite que precisa ficar registrado: **o resumo descreve a primeira
 * série**. Fichas com séries heterogêneas (pirâmide, drop) não cabem em um
 * chip, e a tela completa é quem mostra série a série. Ver o ponto 7 de
 * `docs/design/ATL-UI-012-validacao.md`.
 */
export interface PrescriptionSummary {
  /** "4 × 8–12 reps" ou "3 × 45 s". */
  sets: string;
  /** "90 s" — descanso prescrito da primeira série. */
  rest: string;
  /** "RIR 2", ou null quando a prescrição não define reserva. */
  rir: string | null;
  /** `true` quando as demais séries divergem da primeira. */
  varies: boolean;
}

export function prescriptionSummary(exercise: ExercisePrescription): PrescriptionSummary {
  const first = exercise.sets[0]!;
  const target =
    first.targetDurationSeconds !== null
      ? first.targetDurationSeconds + ' ' + t('secondsShort')
      : (first.targetReps ?? '—') +
        (first.targetRepsMax ? '–' + first.targetRepsMax : '') +
        ' ' +
        t('repsShort');

  const varies = exercise.sets.some(
    (set) =>
      set.targetReps !== first.targetReps ||
      set.targetRepsMax !== first.targetRepsMax ||
      set.targetDurationSeconds !== first.targetDurationSeconds,
  );

  return {
    sets: exercise.sets.length + ' × ' + target,
    rest: first.restSeconds + ' ' + t('secondsShort'),
    rir: first.targetRir === null ? null : t('planRir') + ': ' + first.targetRir,
    varies,
  };
}
