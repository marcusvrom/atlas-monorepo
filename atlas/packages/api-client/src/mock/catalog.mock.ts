import type {
  ExerciseDetail,
  ExerciseFilter,
  ExerciseId,
  ExerciseSummary,
  MuscleGroup,
  Page,
} from '@atlas/contracts';
import {
  ExerciseDetail as ExerciseDetailSchema,
  MuscleGroup as MuscleGroupSchema,
  ExerciseFilter as FilterSchema,
  ExerciseSummary as SummarySchema,
  page,
} from '@atlas/contracts';
import { ApiError } from '../errors.js';
import type { CatalogPort } from '../ports/catalog.port.js';
import { simulate } from './runtime.js';
import type { MockStore } from './store.js';

export class MockCatalogAdapter implements CatalogPort {
  constructor(private readonly store: MockStore) {}

  async listExercises(filter: ExerciseFilter): Promise<Page<ExerciseSummary>> {
    return simulate(this.store.config, () => {
      filter = FilterSchema.parse(filter);
      const limit = filter.limit ?? 20;
      const term = filter.query?.trim().toLowerCase();

      const filtered = this.store.exercises.filter((e) => {
        if (term && !normalize(e.name).includes(normalize(term))) return false;
        if (filter.muscleCode && e.primaryMuscleCode !== filter.muscleCode) return false;
        if (filter.equipment && e.equipment !== filter.equipment) return false;
        if (filter.difficulty && e.difficulty !== filter.difficulty) return false;
        return true;
      });

      const start = filter.cursor ? Number.parseInt(filter.cursor, 10) : 0;
      const slice = filtered.slice(start, start + limit);
      const nextIndex = start + limit;

      return page(SummarySchema).parse({
        items: slice.map(toSummary),
        nextCursor: nextIndex < filtered.length ? String(nextIndex) : null,
      });
    });
  }

  async getExercise(id: ExerciseId): Promise<ExerciseDetail> {
    return simulate(this.store.config, () => {
      const found = this.store.exercises.find((e) => e.id === id);
      if (!found) throw ApiError.notFound('Exercício');
      // Mock valida com o MESMO schema do HTTP. Sem isso a garantia é ilusória.
      return ExerciseDetailSchema.parse(found);
    });
  }

  async listMuscleGroups(): Promise<MuscleGroup[]> {
    return simulate(this.store.config, () =>
      this.store.muscleGroups.map((m) => MuscleGroupSchema.parse(m)),
    );
  }
}

function toSummary(e: ExerciseDetail): ExerciseSummary {
  return {
    id: e.id,
    name: e.name,
    primaryMuscleCode: e.primaryMuscleCode,
    equipment: e.equipment,
    difficulty: e.difficulty,
    thumbnailUrl: e.thumbnailUrl,
    isCustom: e.isCustom,
  };
}

/** Busca sem acento — "supino inclinado" deve achar "Supino Inclinado". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
