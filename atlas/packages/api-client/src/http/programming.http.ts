import {
  TodayWorkout as TodayWorkoutSchema,
  WorkoutPlan as WorkoutPlanSchema,
  WorkoutPlanSummary as WorkoutPlanSummarySchema,
  page,
  UpdatePlanInput as UpdatePlanSchema,
  CreatePlanInput as CreatePlanSchema,
  type UpdatePlanInput,
  type CreatePlanInput,
  type Page,
  type TodayWorkout,
  type WorkoutPlan,
  type WorkoutPlanId,
  type WorkoutPlanSummary,
} from '@atlas/contracts';
import { z } from 'zod';
import type { PlanFilter, ProgrammingPort } from '../ports/programming.port.js';
import type { HttpClient } from './http-client.js';

const PlanPage = page(WorkoutPlanSummarySchema);
const NullableToday = TodayWorkoutSchema.nullable();

export class HttpProgrammingAdapter implements ProgrammingPort {
  constructor(private readonly http: HttpClient) {}

  async getTodayWorkout(): Promise<TodayWorkout | null> {
    return this.http.request('/api/v1/workout-plans/today', NullableToday);
  }

  async listPlans(filter?: PlanFilter): Promise<Page<WorkoutPlanSummary>> {
    return this.http.request('/api/v1/workout-plans', PlanPage, {
      query: { status: filter?.status, cursor: filter?.cursor, limit: filter?.limit },
    });
  }

  async getPlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return this.http.request(`/api/v1/workout-plans/${id}`, WorkoutPlanSchema);
  }

  async createPlan(input: CreatePlanInput): Promise<WorkoutPlan> {
    // 402 vira ApiError('quotaExceeded') no HttpClient — mesma UI de paywall do mock.
    return this.http.request('/api/v1/workout-plans', WorkoutPlanSchema, {
      method: 'POST',
      body: CreatePlanSchema.parse(input),
    });
  }

  async updatePlan(id: WorkoutPlanId, input: UpdatePlanInput): Promise<WorkoutPlan> {
    return this.http.request(`/api/v1/workout-plans/${id}`, WorkoutPlanSchema, {
      method: 'PUT',
      body: UpdatePlanSchema.parse(input),
    });
  }
  async revisePlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return this.http.request(`/api/v1/workout-plans/${id}/revisions`, WorkoutPlanSchema, {
      method: 'POST',
    });
  }
  async publishPlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return this.http.request(`/api/v1/workout-plans/${id}/publish`, WorkoutPlanSchema, {
      method: 'POST',
    });
  }

  async activatePlan(id: WorkoutPlanId): Promise<void> {
    await this.http.request(`/api/v1/workout-plans/${id}/activate`, z.void(), { method: 'POST' });
  }
}
