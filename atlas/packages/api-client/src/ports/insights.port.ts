import type { AdherenceSummary, ExerciseId, ExerciseProgression, MuscleVolume } from '@atlas/contracts';

export interface InsightsPort {
  /** Alimenta o heatmap anatômico. Ver spec 00 §8.3. */
  getMuscleVolume(params: { periodDays: 7 | 30 | 90 }): Promise<MuscleVolume[]>;
  getAdherence(params: { periodDays: 7 | 30 | 90 }): Promise<AdherenceSummary>;
  getExerciseProgression(exerciseId: ExerciseId): Promise<ExerciseProgression>;
}
