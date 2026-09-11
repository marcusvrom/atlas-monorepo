import type {
  LogSetsResult,
  Page,
  PerformedSet,
  SessionId,
  SessionSummary,
  StartSessionInput,
  TrainingSession,
} from '@atlas/contracts';
import { page, SessionSummary as SummarySchema, PerformedSet as PerformedSetSchema } from '@atlas/contracts';
import { totalVolume } from '@atlas/domain';
import { ApiError } from '../errors.js';
import type { SessionPort } from '../ports/session.port.js';
import { simulate } from './runtime.js';
import type { MockStore } from './store.js';

export class MockSessionAdapter implements SessionPort {
  constructor(private readonly store: MockStore) {}

  async startSession(input: StartSessionInput): Promise<TrainingSession> {
    return simulate(this.store.config, () => {
      // Idempotência também no mock — é assim que o reenvio é testado
      // antes de existir backend. Ver AGENTS.md R7.
      const existing = this.store.sessions.find((s) => s.id === input.clientGeneratedId);
      if (existing) return existing;

      const plan = this.store.plans.find((p) => p.id === input.planId);
      const day = plan?.days.find((d) => d.id === input.dayId) ?? plan?.days[0];

      const session: TrainingSession = {
        id: input.clientGeneratedId as SessionId,
        planId: plan?.id ?? null,
        planVersion: plan?.version ?? null,
        dayLabel: day?.label ?? 'Treino livre',
        status: 'inProgress',
        startedAt: new Date().toISOString(),
        completedAt: null,
        sets: [],
        totalVolumeKg: 0,
        durationSeconds: 0,
      };
      this.store.sessions.unshift(session);
      return session;
    });
  }

  async getSession(id: SessionId): Promise<TrainingSession> {
    return simulate(this.store.config, () => this.require(id));
  }

  /**
   * Resultado PARTICIONADO: aceito / duplicado / rejeitado.
   * Um item inválido não pode invalidar o lote e travar a fila do device.
   */
  async logSets(id: SessionId, sets: PerformedSet[]): Promise<LogSetsResult> {
    return simulate(this.store.config, () => {
      const session = this.require(id);
      const result: LogSetsResult = { accepted: [], duplicated: [], rejected: [] };

      for (const candidate of sets) {
        const parsed = PerformedSetSchema.safeParse(candidate);
        if (!parsed.success) {
          result.rejected.push({
            clientGeneratedId: candidate.clientGeneratedId,
            reason: parsed.error.issues[0]?.message ?? 'invalid',
          });
          continue;
        }
        const set = parsed.data;

        if (session.sets.some((s) => s.clientGeneratedId === set.clientGeneratedId)) {
          result.duplicated.push(set.clientGeneratedId);
          continue;
        }
        if (!this.store.exercises.some((e) => e.id === set.exerciseId)) {
          result.rejected.push({
            clientGeneratedId: set.clientGeneratedId,
            reason: 'exercise_not_found',
          });
          continue;
        }

        session.sets.push(set);
        result.accepted.push(set.clientGeneratedId);
      }

      session.totalVolumeKg = totalVolume(
        session.sets.map((s) => ({
          weightKg: s.weightKg,
          reps: s.reps,
          isWarmup: s.isWarmup,
          rir: s.rir,
        })),
      );
      return result;
    });
  }

  async completeSession(id: SessionId): Promise<TrainingSession> {
    return simulate(this.store.config, () => {
      const session = this.require(id);
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.durationSeconds = Math.max(
        0,
        Math.round(
          (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
        ),
      );
      return session;
    });
  }

  async abandonSession(id: SessionId): Promise<void> {
    return simulate(this.store.config, () => {
      this.require(id).status = 'abandoned';
    });
  }

  async listSessions(params?: { cursor?: string | null; limit?: number }): Promise<Page<SessionSummary>> {
    return simulate(this.store.config, () => {
      const limit = params?.limit ?? 20;
      const start = params?.cursor ? Number.parseInt(params.cursor, 10) : 0;
      const all = this.store.sessions.map(toSummary).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt));
      return page(SummarySchema).parse({
        items: all.slice(start, start + limit),
        nextCursor: start + limit < all.length ? String(start + limit) : null,
      });
    });
  }

  private require(id: SessionId): TrainingSession {
    const found = this.store.sessions.find((s) => s.id === id);
    if (!found) throw ApiError.notFound('Sessão');
    return found;
  }
}

function toSummary(s: TrainingSession): SessionSummary {
  const { sets, ...rest } = s;
  return {
    ...rest,
    setCount: sets.length,
    exerciseCount: new Set(sets.map((x) => x.exerciseId)).size,
  };
}
