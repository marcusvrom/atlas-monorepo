import type { GoalType } from '@atlas/contracts';
export type ProgressSection =
  'composition' | 'volume' | 'strength' | 'rehabilitation' | 'adherence';
export function progressOrder(goal: GoalType): ProgressSection[] {
  switch (goal) {
    case 'fatLoss':
      return ['composition', 'adherence', 'volume', 'strength'];
    case 'strength':
      return ['strength', 'volume', 'adherence', 'composition'];
    case 'rehabilitation':
      return ['rehabilitation', 'adherence', 'volume'];
    case 'hypertrophy':
      return ['volume', 'composition', 'strength', 'adherence'];
    default:
      return ['adherence', 'strength', 'volume', 'composition'];
  }
}
