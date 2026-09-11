import {
  UpdatePlanInput as UpdateSchema,
  CreatePlanInput as CreateSchema,
  WorkoutPlan as PlanSchema,
  WorkoutPlanSummary as SummarySchema,
  TodayWorkout as TodaySchema,
  page,
  type UpdatePlanInput,
  type CreatePlanInput,
  type Page,
  type TodayWorkout,
  type WorkoutPlan,
  type WorkoutPlanId,
  type WorkoutPlanSummary,
} from '@atlas/contracts';
import { ApiError } from '../errors.js';
import type { PlanFilter, ProgrammingPort } from '../ports/programming.port.js';
import { simulate, uuidV4From, createRandom } from './runtime.js';
import type { MockStore } from './store.js';

const FREE_PLAN_LIMIT = 2;

export class MockProgrammingAdapter implements ProgrammingPort {
  private readonly random = createRandom(Date.now() % 100000);

  constructor(private readonly store: MockStore) {}

  async getTodayWorkout(): Promise<TodayWorkout | null> {
    return simulate(this.store.config, () => {
      const active = this.store.plans.find((p) => p.isActive && p.status === 'published');
      if (!active) return null;

      const weekday = new Date().getDay();
      const day = active.days.find((d) => d.slot === weekday) ?? active.days[0];
      if (!day) return null;

      const inProgress = this.store.sessions.find((s) => s.status === 'inProgress');

      return TodaySchema.parse({
        planId: active.id,
        planName: active.name,
        day,
        estimatedVolumeKg: estimateVolume(day.exercises),
        lastPerformedAt: this.store.sessions[0]?.startedAt ?? null,
        inProgressSessionId: inProgress?.id ?? null,
      });
    });
  }

  async listPlans(filter?: PlanFilter): Promise<Page<WorkoutPlanSummary>> {
    return simulate(this.store.config, () => {
      const limit = filter?.limit ?? 20;
      const items = this.store.plans
        .filter((p) => (filter?.status ? p.status === filter.status : p.status !== 'archived'))
        .map(toSummary);
      const start = filter?.cursor ? Number.parseInt(filter.cursor, 10) : 0;
      const slice = items.slice(start, start + limit);
      return page(SummarySchema).parse({
        items: slice,
        nextCursor: start + limit < items.length ? String(start + limit) : null,
      });
    });
  }

  async getPlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return simulate(this.store.config, () => {
      const plan = this.store.plans.find((p) => p.id === id);
      if (!plan) throw ApiError.notFound('Ficha');
      return PlanSchema.parse(plan);
    });
  }

  async createPlan(input: CreatePlanInput): Promise<WorkoutPlan> {
    return simulate(this.store.config, () => {
      input = CreateSchema.parse(input);
      // O paywall é demonstrável na Fase 0 exatamente como será em produção.
      const activeCount = this.store.plans.filter((p) => p.status !== 'archived').length;
      if ((this.store.config.plan??this.store.me.planKey) === 'free' && activeCount >= FREE_PLAN_LIMIT) {
        throw ApiError.quotaExceeded({
          feature: 'activeWorkoutPlans',
          limit: FREE_PLAN_LIMIT,
          currentPlan: 'free',
          suggestedUpgrade: 'pro',
        });
      }

      const plan: WorkoutPlan = {
        id: uuidV4From(this.random) as WorkoutPlanId,
        ownerId: this.store.me.id,
        name: input.name,
        goal: input.goal,
        status: 'draft',
        origin: 'selfCreated',
        version: 1,
        dayCount: 0,
        prescribedByName: null,
        isActive: false,
        days: [],
      };
      this.store.plans.unshift(plan);
      return PlanSchema.parse(plan);
    });
  }

  async updatePlan(id: WorkoutPlanId, input: UpdatePlanInput): Promise<WorkoutPlan> {
    return simulate(this.store.config, () => {
      const plan = this.store.plans.find((p) => p.id === id);
      if (!plan) throw ApiError.notFound('Ficha');
      if (plan.status !== 'draft') throw new ApiError('conflict', 'Crie uma revisão para editar');
      const update = UpdateSchema.parse(input);
      const valid = PlanSchema.parse({ ...plan, ...update, dayCount: update.days.length });
      this.store.plans[this.store.plans.indexOf(plan)] = valid;
      return PlanSchema.parse(valid);
    });
  }
  async revisePlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return simulate(this.store.config, () => {
      const plan = this.store.plans.find((p) => p.id === id);
      if (!plan) throw ApiError.notFound('Ficha');
      if (plan.status !== 'published')
        throw new ApiError('conflict', 'Somente fichas publicadas podem ser revisadas');
      const revision = PlanSchema.parse({
        ...plan,
        id: uuidV4From(this.random),
        version: plan.version + 1,
        status: 'draft',
        isActive: false,
        days: plan.days.map((day) => ({ ...day, id: uuidV4From(this.random) })),
      });
      this.store.plans.unshift(revision);
      return PlanSchema.parse(revision);
    });
  }
  async publishPlan(id: WorkoutPlanId): Promise<WorkoutPlan> {
    return simulate(this.store.config, () => {
      const plan = this.store.plans.find((p) => p.id === id);
      if (!plan) throw ApiError.notFound('Ficha');
      // Mesma invariante do agregado do backend. Ver spec 00 §8.1.
      if (plan.status !== 'draft')
        throw new ApiError('conflict', 'Crie uma revisão para alterar esta ficha');
      if (plan.days.length === 0 || plan.days.some((day) => day.exercises.length === 0)) {
        throw new ApiError('validation', 'Ficha sem dias não pode ser publicada');
      }
      plan.status = 'published';
      return PlanSchema.parse(plan);
    });
  }

  async activatePlan(id: WorkoutPlanId): Promise<void> {
    return simulate(this.store.config, () => {
      const selected = this.store.plans.find((plan) => plan.id === id);
      if (!selected) throw ApiError.notFound('Ficha');
      if (selected.status !== 'published')
        throw new ApiError('validation', 'Publique a ficha antes de ativar');
      for (const plan of this.store.plans) plan.isActive = plan.id === id;
    });
  }
}

function toSummary(p: WorkoutPlan): WorkoutPlanSummary {
  return {
    id: p.id,
    name: p.name,
    goal: p.goal,
    status: p.status,
    origin: p.origin,
    version: p.version,
    dayCount: p.days.length,
    prescribedByName: p.prescribedByName,
    isActive: p.isActive,
  };
}

function estimateVolume(exercises: WorkoutPlan['days'][number]['exercises']): number {
  return Math.round(
    exercises.reduce(
      (acc, ex) =>
        acc + ex.sets.reduce((sum, s) => sum + (s.targetWeightKg ?? 0) * (s.targetReps ?? 0), 0),
      0,
    ),
  );
}
