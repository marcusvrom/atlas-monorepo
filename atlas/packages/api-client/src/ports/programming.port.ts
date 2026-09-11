import type {
  CreatePlanInput,
  UpdatePlanInput,
  Page,
  TodayWorkout,
  WorkoutPlan,
  WorkoutPlanId,
  WorkoutPlanSummary,
} from '@atlas/contracts';

export interface PlanFilter {
  status?: 'draft' | 'published' | 'archived';
  cursor?: string | null;
  limit?: number;
}

export interface ProgrammingPort {
  /** Agregação de caso de uso: a tela "Hoje" pede isto, não três endpoints. */
  getTodayWorkout(): Promise<TodayWorkout | null>;
  listPlans(filter?: PlanFilter): Promise<Page<WorkoutPlanSummary>>;
  getPlan(id: WorkoutPlanId): Promise<WorkoutPlan>;
  /** Pode lançar ApiError('quotaExceeded') no plano Free. */
  createPlan(input: CreatePlanInput): Promise<WorkoutPlan>;
  updatePlan(id: WorkoutPlanId, input: UpdatePlanInput): Promise<WorkoutPlan>;
  revisePlan(id: WorkoutPlanId): Promise<WorkoutPlan>;
  publishPlan(id: WorkoutPlanId): Promise<WorkoutPlan>;
  activatePlan(id: WorkoutPlanId): Promise<void>;
}
