import {
  LogSetsResult as LogSetsResultSchema,
  SessionSummary as SessionSummarySchema,
  TrainingSession as TrainingSessionSchema,
  page,
  type LogSetsResult,
  type Page,
  type PerformedSet,
  type SessionId,
  type SessionSummary,
  type StartSessionInput,
  type TrainingSession,
} from '@atlas/contracts';
import { z } from 'zod';
import type { SessionPort } from '../ports/session.port.js';
import type { HttpClient } from './http-client.js';

const SessionPage = page(SessionSummarySchema);

export class HttpSessionAdapter implements SessionPort {
  constructor(private readonly http: HttpClient) {}

  async startSession(input: StartSessionInput): Promise<TrainingSession> {
    return this.http.request('/api/v1/sessions', TrainingSessionSchema, {
      method: 'POST',
      body: input,
      idempotencyKey: input.clientGeneratedId,
    });
  }

  async getSession(id: SessionId): Promise<TrainingSession> {
    return this.http.request(`/api/v1/sessions/${id}`, TrainingSessionSchema);
  }

  async logSets(id: SessionId, sets: PerformedSet[]): Promise<LogSetsResult> {
    // O lote inteiro é idempotente; itens individuais também. Ver spec 00 §9.2.
    return this.http.request(`/api/v1/sessions/${id}/sets:batch`, LogSetsResultSchema, {
      method: 'POST',
      body: { sets },
      idempotencyKey: batchKey(sets),
    });
  }

  async completeSession(id: SessionId): Promise<TrainingSession> {
    return this.http.request(`/api/v1/sessions/${id}/complete`, TrainingSessionSchema, {
      method: 'POST',
    });
  }

  async abandonSession(id: SessionId): Promise<void> {
    await this.http.request(`/api/v1/sessions/${id}/abandon`, z.void(), { method: 'POST' });
  }

  async listSessions(params?: { cursor?: string | null; limit?: number }): Promise<Page<SessionSummary>> {
    return this.http.request('/api/v1/sessions', SessionPage, {
      query: { cursor: params?.cursor, limit: params?.limit },
    });
  }
}

/** Chave estável derivada do conteúdo: reenvio do mesmo lote é sempre no-op. */
function batchKey(sets: PerformedSet[]): string {
  return sets.map((s) => s.clientGeneratedId).sort().join('|');
}
