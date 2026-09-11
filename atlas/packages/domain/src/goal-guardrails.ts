import type { GoalType } from '@atlas/contracts';
import { bodyMassIndex } from './calculations.js';

/**
 * Guardrails de saúde. Aplicados no DOMÍNIO, não na UI — a UI só apresenta o
 * resultado. Ver spec 00 §4.5 e §15.3.
 *
 * O produto não pode facilitar metas de emagrecimento perigosas, e nenhum texto
 * do app deve reforçar restrição extrema ou insatisfação corporal.
 */

export const MIN_SAFE_BMI = 17.5;
export const MAX_SAFE_WEEKLY_LOSS_RATE = 0.01; // 1% do peso corporal por semana

export type GuardrailCode =
  | 'targetBmiTooLow'
  | 'weeklyRateTooAggressive'
  | 'timeframeTooShort';

export interface GuardrailViolation {
  readonly code: GuardrailCode;
  /** Mensagem neutra, orientada a segurança. Nunca julgamento sobre o corpo. */
  readonly messageKey: string;
  readonly suggestion?: { readonly targetDateIso?: string; readonly targetWeightKg?: number };
}

export interface GoalValidationInput {
  readonly goal: GoalType;
  readonly currentWeightKg: number;
  readonly heightCm: number;
  readonly targetWeightKg: number | null;
  readonly targetDateIso: string | null;
  readonly nowIso: string;
}

export function validateGoal(input: GoalValidationInput): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];
  const { currentWeightKg, heightCm, targetWeightKg, targetDateIso, nowIso } = input;

  if (targetWeightKg === null) return violations;

  if (bodyMassIndex(targetWeightKg, heightCm) < MIN_SAFE_BMI) {
    const safeWeight = Math.ceil(MIN_SAFE_BMI * (heightCm / 100) ** 2 * 10) / 10;
    violations.push({
      code: 'targetBmiTooLow',
      messageKey: 'goal.guardrail.bmiTooLow',
      suggestion: { targetWeightKg: safeWeight },
    });
  }

  if (targetDateIso !== null && targetWeightKg < currentWeightKg) {
    const weeks = weeksBetween(nowIso, targetDateIso);
    if (weeks <= 0) {
      violations.push({ code: 'timeframeTooShort', messageKey: 'goal.guardrail.timeframe' });
    } else {
      const weeklyRate = (currentWeightKg - targetWeightKg) / weeks / currentWeightKg;
      if (weeklyRate > MAX_SAFE_WEEKLY_LOSS_RATE) {
        const safeWeeks = Math.ceil(
          (currentWeightKg - targetWeightKg) / (currentWeightKg * MAX_SAFE_WEEKLY_LOSS_RATE),
        );
        violations.push({
          code: 'weeklyRateTooAggressive',
          messageKey: 'goal.guardrail.rateTooFast',
          suggestion: { targetDateIso: addWeeks(nowIso, safeWeeks) },
        });
      }
    }
  }

  return violations;
}

function weeksBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return ms / (7 * 24 * 60 * 60 * 1000);
}

function addWeeks(fromIso: string, weeks: number): string {
  const d = new Date(fromIso);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString();
}
