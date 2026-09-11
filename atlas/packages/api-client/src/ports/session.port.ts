import type {
  LogSetsResult,
  Page,
  PerformedSet,
  SessionId,
  SessionSummary,
  StartSessionInput,
  TrainingSession,
} from '@atlas/contracts';

export interface SessionPort {
  startSession(input: StartSessionInput): Promise<TrainingSession>;
  getSession(id: SessionId): Promise<TrainingSession>;
  /**
   * Envio em lote, idempotente por clientGeneratedId.
   * Resultado é PARTICIONADO: um item inválido nunca invalida o lote inteiro,
   * o que evita travar a fila de sync do device para sempre. Ver spec 00 §9.2.
   */
  logSets(id: SessionId, sets: PerformedSet[]): Promise<LogSetsResult>;
  completeSession(id: SessionId): Promise<TrainingSession>;
  abandonSession(id: SessionId): Promise<void>;
  listSessions(params?: { cursor?: string | null; limit?: number }): Promise<Page<SessionSummary>>;
}
