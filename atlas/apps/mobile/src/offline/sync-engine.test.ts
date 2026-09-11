import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, vi } from 'vitest';
import { createApiClient, type SessionPort } from '@atlas/api-client';
import { PerformedSet, StartSessionInput, SessionId, ExerciseId } from '@atlas/contracts';
import { HttpClient } from '../../../../packages/api-client/src/http/http-client';
import { HttpSessionAdapter } from '../../../../packages/api-client/src/http/session.http';
import { OfflineStore, type OfflineDatabase, type SqlValue } from './store';
import { SyncEngine, retryDelay } from './sync-engine';
function database(path = ':memory:') {
  const db = new DatabaseSync(path);
  const driver: OfflineDatabase = {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    runAsync: async (sql, ...params: SqlValue[]) => ({
      changes: Number(db.prepare(sql).run(...params).changes),
    }),
    getAllAsync: async <T>(sql: string, ...params: SqlValue[]) =>
      db.prepare(sql).all(...params) as T[],
    getFirstAsync: async <T>(sql: string, ...params: SqlValue[]) =>
      (db.prepare(sql).get(...params) as T) ?? null,
  };
  return { db, store: new OfflineStore(driver) };
}
async function setup() {
  const api = createApiClient({ mode: 'mock', mock: { seed: 42, latencyMs: 0, errorRate: 0 } });
  const input = StartSessionInput.parse({
    clientGeneratedId: randomUUID(),
    planId: null,
    dayId: null,
  });
  const session = await api.session.startSession(input);
  const exercise = (await api.catalog.listExercises({ limit: 1 })).items[0]!;
  const set = PerformedSet.parse({
    clientGeneratedId: randomUUID(),
    exerciseId: exercise.id,
    order: 1,
    weightKg: 10,
    reps: 10,
    durationSeconds: null,
    rpe: null,
    rir: 2,
    isWarmup: false,
    painLevel: null,
    performedAt: new Date().toISOString(),
  });
  return { api, input, session, set };
}
describe.each(['mock', 'http'] as const)('ATL-SES-004 mesma suíte via %s', (mode) => {
  it('retoma o SQLite e sincroniza aceitos, duplicados e rejeitados sem travar a fila', async () => {
    const { api, input, session, set } = await setup();
    const dir = mkdtempSync(join(tmpdir(), 'atlas-sync-'));
    const filename = join(dir, 'offline.db');
    let handle = database(filename);
    await handle.store.initialize();
    let port: SessionPort = api.session;
    if (mode === 'http') {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, options: RequestInit) => {
          const path = new URL(url).pathname;
          const body = options.body ? JSON.parse(String(options.body)) : null;
          let result;
          if (path.endsWith('/sets:batch')) {
            expect(new Headers(options.headers).get('Idempotency-Key')).toBeTruthy();
            result = await api.session.logSets(
              SessionId.parse(path.split('/')[4]),
              body.sets.map((value: unknown) => PerformedSet.parse(value)),
            );
          } else if (path.endsWith('/complete'))
            result = await api.session.completeSession(SessionId.parse(path.split('/')[4]));
          else result = await api.session.startSession(StartSessionInput.parse(body));
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }),
      );
      port = new HttpSessionAdapter(new HttpClient({ baseUrl: 'https://example.test' }));
    }
    try {
      await handle.store.saveSession(session, input);
      await handle.store.enqueueSets(session.id, [
        set,
        {
          ...set,
          clientGeneratedId: randomUUID(),
          exerciseId: ExerciseId.parse(randomUUID()),
        },
      ]);
      await handle.store.setRest(session.id, Date.now() + 60000);
      handle.db.close();
      handle = database(filename);
      await handle.store.initialize();
      expect((await handle.store.stats()).pending).toBe(3);
      expect((await handle.store.session(session.id))?.sets).toHaveLength(2);
      expect((await handle.store.local(session.id))?.restEndsAt).toBeGreaterThan(Date.now());
      await api.session.logSets(session.id, [set]);
      await new SyncEngine(handle.store, port).flush();
      expect(await handle.store.stats()).toEqual({ pending: 0, rejected: 1 });
      expect((await api.session.getSession(session.id)).sets).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
      handle.db.close();
      for (const suffix of ['', '-wal', '-shm']) rmSync(filename + suffix, { force: true });
      rmdirSync(dir);
    }
  });
});
it('10k operações usam lotes de até 50 e consumo de memória limitado no host', async () => {
  const { api, input, session, set } = await setup();
  const { db, store } = database();
  await store.initialize();
  try {
    await store.saveSession(session, input);
    for (let offset = 0; offset < 10000; offset += 50)
      await store.enqueueSets(
        session.id,
        Array.from({ length: 50 }, (_, index) => ({
          ...set,
          clientGeneratedId: randomUUID(),
          order: offset + index + 1,
        })),
      );
    const original = api.session.logSets.bind(api.session);
    let largest = 0;
    const spy = vi.spyOn(api.session, 'logSets').mockImplementation((id, sets) => {
      largest = Math.max(largest, sets.length);
      return original(id, sets);
    });
    const before = process.memoryUsage().heapUsed;
    let peak = before;
    await new SyncEngine(store, api.session, () => {
      peak = Math.max(peak, process.memoryUsage().heapUsed);
    }).flush();
    expect(largest).toBeLessThanOrEqual(50);
    expect((await store.stats()).pending).toBe(0);
    expect((await api.session.getSession(session.id)).sets).toHaveLength(10000);
    expect(peak - before).toBeLessThan(128 * 1024 * 1024);
    spy.mockRestore();
  } finally {
    db.close();
  }
}, 60000);
it('backoff tem jitter e nunca excede cinco minutos', () => {
  expect(retryDelay(0, () => 0)).toBe(500);
  expect(retryDelay(0, () => 1)).toBe(1000);
  expect(retryDelay(30, () => 1)).toBe(300000);
});
