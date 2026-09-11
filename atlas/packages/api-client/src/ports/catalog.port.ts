import type {
  ExerciseDetail,
  ExerciseFilter,
  ExerciseId,
  ExerciseSummary,
  MuscleGroup,
  Page,
} from '@atlas/contracts';

/**
 * Catálogo de exercícios e mapeamento anatômico.
 *
 * Assinaturas orientadas a CASO DE USO, não a endpoint HTTP: o backend pode
 * agregar chamadas depois sem quebrar a UI. Ver ADR-0014.
 */
export interface CatalogPort {
  listExercises(filter: ExerciseFilter): Promise<Page<ExerciseSummary>>;
  getExercise(id: ExerciseId): Promise<ExerciseDetail>;
  listMuscleGroups(): Promise<MuscleGroup[]>;
}
