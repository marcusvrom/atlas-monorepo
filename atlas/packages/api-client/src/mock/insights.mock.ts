import {
  AdherenceSummary,
  type ExerciseId,
  ExerciseProgression,
  MuscleVolume,
} from '@atlas/contracts';
import { adherenceRate, estimateOneRepMax, totalVolume } from '@atlas/domain';
import { ApiError } from '../errors.js';
import type { InsightsPort } from '../ports/insights.port.js';
import { simulate } from './runtime.js';
import type { MockStore } from './store.js';

export class MockInsightsAdapter implements InsightsPort {
  constructor(private readonly store: MockStore) {}

  /**
   * Reproduz a agregação SQL do backend (spec 00 §8.3) sobre o estado em
   * memória: Σ (carga × reps × activationWeight) por grupo muscular.
   * Fazer a conta de verdade aqui é o que garante que o heatmap da demo
   * reaja a treinos registrados durante a apresentação.
   */
  async getMuscleVolume(params: { periodDays: 7 | 30 | 90 }): Promise<MuscleVolume[]> {
    return simulate(this.store.config, () => {
      const since = Date.now() - params.periodDays * 24 * 60 * 60 * 1000;
      const totals = new Map<string, { volume: number; effective: number }>();

      for (const session of this.store.sessions) {
        if (
          session.status !== 'completed' ||
          Date.parse(session.startedAt) < since ||
          Date.parse(session.startedAt) > Date.now()
        )
          continue;

        for (const set of session.sets) {
          if (set.isWarmup || set.weightKg === null || set.reps === null) continue;
          const exercise = this.store.exercises.find((e) => e.id === set.exerciseId);
          if (!exercise) continue;

          for (const activation of exercise.activations) {
            const current = totals.get(activation.muscleCode) ?? { volume: 0, effective: 0 };
            current.volume += set.weightKg * set.reps * activation.activationWeight;
            if (activation.role === 'primary' && (set.rir ?? 10) <= 3) current.effective += 1;
            totals.set(activation.muscleCode, current);
          }
        }
      }

      const max = Math.max(1, ...[...totals.values()].map((v) => v.volume));

      return MuscleVolume.array().parse(
        [...totals.entries()]
          .map(([code, value]) => {
            const group = this.store.muscleGroups.find((g) => g.code === code);
            return {
              muscleGroupId: group?.id ?? 0,
              muscleCode: code,
              displayName: group?.displayName ?? code,
              weightedVolumeKg: Math.round(value.volume),
              effectiveSets: value.effective,
              intensity: Math.min(1, value.volume / max),
            } satisfies MuscleVolume;
          })
          .sort((a, b) => b.weightedVolumeKg - a.weightedVolumeKg),
      );
    });
  }

  async getAdherence(params: { periodDays: 7 | 30 | 90 }): Promise<AdherenceSummary> {
    return simulate(this.store.config, () => {
      const since = Date.now() - params.periodDays * 24 * 60 * 60 * 1000;
      const completed = this.store.sessions.filter(
        (s) => s.status === 'completed' && new Date(s.startedAt).getTime() >= since,
      ).length;
      const weeklyTarget = this.store.me.goal?.weeklySessionTarget ?? 4;
      const planned = Math.round((params.periodDays / 7) * weeklyTarget);

      return AdherenceSummary.parse({
        periodDays: params.periodDays,
        plannedSessions: planned,
        completedSessions: completed,
        rate: adherenceRate(completed, planned),
        currentStreak: this.currentStreak(),
      });
    });
  }

  async getExerciseProgression(exerciseId: ExerciseId): Promise<ExerciseProgression> {
    return simulate(this.store.config, () => {
      const exercise = this.store.exercises.find((e) => e.id === exerciseId);
      if (!exercise) throw ApiError.notFound('Exercício');

      const points = this.store.sessions
        .filter((s) => s.status === 'completed')
        .map((s) => {
          const sets = s.sets.filter((x) => x.exerciseId === exerciseId && !x.isWarmup);
          if (sets.length === 0) return null;

          const top = sets.reduce((best, cur) =>
            (cur.weightKg ?? 0) > (best.weightKg ?? 0) ? cur : best,
          );
          return {
            at: s.startedAt,
            topSetWeightKg: top.weightKg ?? 0,
            topSetReps: top.reps ?? 0,
            estimatedOneRepMaxKg: estimateOneRepMax(top.weightKg ?? 0, top.reps ?? 0),
            totalVolumeKg: totalVolume(
              sets.map((x) => ({
                weightKg: x.weightKg,
                reps: x.reps,
                isWarmup: x.isWarmup,
                rir: x.rir,
              })),
            ),
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

      const recent = points.slice(-4);
      const isStagnant =
        recent.length === 4 &&
        Math.max(...recent.map((p) => p.estimatedOneRepMaxKg)) -
          Math.min(...recent.map((p) => p.estimatedOneRepMaxKg)) <
          1.5;

      return ExerciseProgression.parse({
        exerciseId,
        exerciseName: exercise.name,
        points,
        isStagnant,
      });
    });
  }

  private currentStreak(): number {
    const days = new Set(
      this.store.sessions
        .filter((s) => s.status === 'completed')
        .map((s) => s.startedAt.slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date();
    while (streak < 400) {
      const key = cursor.toISOString().slice(0, 10);
      if (!days.has(key)) break;
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
}
