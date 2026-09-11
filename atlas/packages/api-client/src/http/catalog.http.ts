import { z } from 'zod';
import {
  ExerciseDetail as ExerciseDetailSchema,
  ExerciseSummary as ExerciseSummarySchema,
  MuscleGroup as MuscleGroupSchema,
  page,
  type ExerciseDetail,
  type ExerciseFilter,
  type ExerciseId,
  type ExerciseSummary,
  type MuscleGroup,
  type Page,
} from '@atlas/contracts';
import type { CatalogPort } from '../ports/catalog.port.js';
import type { HttpClient } from './http-client.js';

const ExercisePage = page(ExerciseSummarySchema);
const MuscleGroupList = z.array(MuscleGroupSchema);

export class HttpCatalogAdapter implements CatalogPort {
  constructor(private readonly http: HttpClient) {}

  async listExercises(filter: ExerciseFilter): Promise<Page<ExerciseSummary>> {
    return this.http.request('/api/v1/exercises', ExercisePage, {
      query: {
        q: filter.query,
        muscle: filter.muscleCode,
        equipment: filter.equipment,
        difficulty: filter.difficulty,
        cursor: filter.cursor,
        limit: filter.limit,
      },
    });
  }

  async getExercise(id: ExerciseId): Promise<ExerciseDetail> {
    return this.http.request(`/api/v1/exercises/${id}`, ExerciseDetailSchema);
  }

  async listMuscleGroups(): Promise<MuscleGroup[]> {
    return this.http.request('/api/v1/muscle-groups', MuscleGroupList);
  }
}
