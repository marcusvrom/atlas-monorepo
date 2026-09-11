import {
  SessionSummary,
  WorkoutPlan,
  LocalSession,
  LocalSessionHeader,
  OfflineOperation,
  OutboxRecord,
  PerformedSet,
  TrainingSession,
  type SessionId,
  type StartSessionInput,
} from '@atlas/contracts';
import { totalVolume } from '@atlas/domain';
export type SqlValue = string | number | null;
export interface OfflineDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}
export class OfflineStore {
  private writes: Promise<unknown> = Promise.resolve();
  constructor(private readonly db: OfflineDatabase) {}
  async initialize() {
    const schema = `PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS cached_plans(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS local_sessions(id TEXT PRIMARY KEY,payload TEXT NOT NULL,total_volume REAL NOT NULL);
 CREATE TABLE IF NOT EXISTS performed_sets(id TEXT PRIMARY KEY,session_id TEXT NOT NULL,payload TEXT NOT NULL,synced INTEGER NOT NULL DEFAULT 0);
 CREATE INDEX IF NOT EXISTS performed_session ON performed_sets(session_id);
 CREATE TABLE IF NOT EXISTS outbox_queue(sequence INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,session_id TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at REAL NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending');
 CREATE INDEX IF NOT EXISTS outbox_due ON outbox_queue(status,next_attempt_at,sequence);`;
    // ATL-SES-004: o driver web deve concluir cada DDL antes de criar seus índices.
    for (const statement of schema
      .split(';')
      .map((sql) => sql.trim())
      .filter(Boolean)) {
      await this.db.execAsync(statement);
    }
  }
  private transaction<T>(work: () => Promise<T>): Promise<T> {
    const next = this.writes.then(async () => {
      await this.db.execAsync('BEGIN IMMEDIATE');
      try {
        const result = await work();
        await this.db.execAsync('COMMIT');
        return result;
      } catch (error) {
        await this.db.execAsync('ROLLBACK');
        throw error;
      }
    });
    this.writes = next.catch(() => {});
    return next;
  }
  private async insert(operation: OfflineOperation) {
    const valid = OfflineOperation.parse(operation);
    await this.db.runAsync(
      'INSERT OR IGNORE INTO outbox_queue(id,session_id,kind,payload) VALUES(?,?,?,?)',
      valid.id,
      valid.sessionId,
      valid.kind,
      JSON.stringify(valid),
    );
  }
  async saveSession(value: TrainingSession, input: StartSessionInput, enqueue = true) {
    const session = TrainingSession.parse(value);
    const local = LocalSession.parse({
      header: LocalSessionHeader.parse(session),
      start: input,
      restEndsAt: 0,
      deviceClockSkewMs: 0,
    });
    await this.transaction(async () => {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO local_sessions(id,payload,total_volume) VALUES(?,?,?)',
        session.id,
        JSON.stringify(local),
        session.totalVolumeKg,
      );
      for (const set of session.sets)
        await this.db.runAsync(
          'INSERT OR IGNORE INTO performed_sets(id,session_id,payload,synced) VALUES(?,?,?,1)',
          set.clientGeneratedId,
          session.id,
          JSON.stringify(set),
        );
      if (enqueue)
        await this.insert({
          kind: 'start',
          id: input.clientGeneratedId,
          sessionId: session.id,
          input,
        });
    });
  }
  async enqueueSets(id: SessionId, values: PerformedSet[]) {
    const sets = values.map((value) => PerformedSet.parse(value));
    await this.transaction(async () => {
      const exists = await this.db.getFirstAsync<{ id: string }>(
        'SELECT id FROM local_sessions WHERE id=?',
        id,
      );
      if (!exists) throw new Error('ATL-SES-004: missing local session');
      for (const set of sets) {
        const result = await this.db.runAsync(
          'INSERT OR IGNORE INTO performed_sets(id,session_id,payload) VALUES(?,?,?)',
          set.clientGeneratedId,
          id,
          JSON.stringify(set),
        );
        if (result.changes) {
          await this.insert({ kind: 'set', id: set.clientGeneratedId, sessionId: id, set });
          await this.db.runAsync(
            'UPDATE local_sessions SET total_volume=total_volume+? WHERE id=?',
            totalVolume([set]),
            id,
          );
        }
      }
    });
  }
  async local(id: SessionId) {
    await this.writes;
    const row = await this.db.getFirstAsync<{ payload: string; total_volume: number }>(
      'SELECT payload,total_volume FROM local_sessions WHERE id=?',
      id,
    );
    if (!row) return null;
    const value = LocalSession.parse(JSON.parse(row.payload));
    return LocalSession.parse({
      ...value,
      header: { ...value.header, totalVolumeKg: row.total_volume },
    });
  }
  async session(id: SessionId) {
    const local = await this.local(id);
    if (!local) return null;
    const rows = await this.db.getAllAsync<{ payload: string }>(
      'SELECT payload FROM performed_sets WHERE session_id=? ORDER BY rowid',
      id,
    );
    return TrainingSession.parse({
      ...local.header,
      sets: rows.map((row) => PerformedSet.parse(JSON.parse(row.payload))),
    });
  }
  async cachePlan(value: WorkoutPlan) {
    const plan = WorkoutPlan.parse(value);
    await this.transaction(async () => {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO cached_plans(id,payload) VALUES(?,?)',
        plan.id,
        JSON.stringify(plan),
      );
    });
  }
  async cachedPlan(id: string) {
    await this.writes;
    const row = await this.db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM cached_plans WHERE id=?',
      id,
    );
    return row ? WorkoutPlan.parse(JSON.parse(row.payload)) : null;
  }
  async summaries() {
    await this.writes;
    const rows = await this.db.getAllAsync<{
      payload: string;
      total_volume: number;
      set_count: number;
      exercise_count: number;
    }>(
      "SELECT l.payload,l.total_volume,COUNT(s.id) AS set_count,COUNT(DISTINCT json_extract(s.payload,'$.exerciseId')) AS exercise_count FROM local_sessions l LEFT JOIN performed_sets s ON s.session_id=l.id GROUP BY l.id",
    );
    return rows.map((row) =>
      SessionSummary.parse({
        ...LocalSession.parse(JSON.parse(row.payload)).header,
        totalVolumeKg: row.total_volume,
        setCount: row.set_count,
        exerciseCount: row.exercise_count,
      }),
    );
  }
  async recent() {
    await this.writes;
    const rows = await this.db.getAllAsync<{ id: string }>(
      'SELECT id FROM local_sessions ORDER BY rowid DESC LIMIT 50',
    );
    return rows.map((row) => row.id);
  }
  async setRest(id: SessionId, restEndsAt: number) {
    await this.transaction(async () => {
      const row = await this.db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM local_sessions WHERE id=?',
        id,
      );
      if (!row) return;
      const local = LocalSession.parse(JSON.parse(row.payload));
      await this.db.runAsync(
        'UPDATE local_sessions SET payload=? WHERE id=?',
        JSON.stringify(LocalSession.parse({ ...local, restEndsAt })),
        id,
      );
    });
  }
  async complete(id: SessionId, operationId: string, completedAt: string) {
    await this.transaction(async () => {
      const row = await this.db.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM local_sessions WHERE id=?',
        id,
      );
      if (!row) throw new Error('ATL-SES-004: missing session');
      const local = LocalSession.parse(JSON.parse(row.payload));
      const header = LocalSessionHeader.parse({
        ...local.header,
        status: 'completed',
        completedAt,
        durationSeconds: Math.max(
          0,
          Math.round((Date.parse(completedAt) - Date.parse(local.header.startedAt)) / 1000),
        ),
      });
      await this.db.runAsync(
        'UPDATE local_sessions SET payload=? WHERE id=?',
        JSON.stringify({ ...local, header }),
        id,
      );
      await this.insert({ kind: 'complete', id: operationId, sessionId: id });
    });
  }
  async take(now: number) {
    await this.writes;
    const rows = await this.db.getAllAsync<{
      sequence: number;
      payload: string;
      attempts: number;
      next_attempt_at: number;
      status: string;
    }>(
      'SELECT sequence,payload,attempts,next_attempt_at,status FROM outbox_queue WHERE status=? AND next_attempt_at<=? ORDER BY sequence LIMIT 50',
      'pending',
      now,
    );
    return rows.map((row) =>
      OutboxRecord.parse({
        sequence: row.sequence,
        operation: JSON.parse(row.payload),
        attempts: row.attempts,
        nextAttemptAt: row.next_attempt_at,
        status: row.status,
      }),
    );
  }
  async acknowledge(ids: string[], rejected: string[] = []) {
    await this.transaction(async () => {
      for (const id of ids) {
        await this.db.runAsync('DELETE FROM outbox_queue WHERE id=?', id);
        await this.db.runAsync('UPDATE performed_sets SET synced=1 WHERE id=?', id);
      }
      for (const id of rejected)
        await this.db.runAsync('UPDATE outbox_queue SET status=? WHERE id=?', 'rejected', id);
    });
  }
  async retry(records: OutboxRecord[], at: number) {
    await this.transaction(async () => {
      for (const row of records)
        await this.db.runAsync(
          'UPDATE outbox_queue SET attempts=attempts+1,next_attempt_at=? WHERE id=?',
          at,
          row.operation.id,
        );
    });
  }
  async stats(id?: SessionId) {
    await this.writes;
    const rows = await this.db.getAllAsync<{ status: string; count: number }>(
      'SELECT status,COUNT(*) AS count FROM outbox_queue' +
        (id ? ' WHERE session_id=?' : '') +
        ' GROUP BY status',
      ...(id ? [id] : []),
    );
    return {
      pending: rows.find((row) => row.status === 'pending')?.count ?? 0,
      rejected: rows.find((row) => row.status === 'rejected')?.count ?? 0,
    };
  }
  async nextAttempt() {
    await this.writes;
    return (
      (
        await this.db.getFirstAsync<{ at: number | null }>(
          'SELECT MIN(next_attempt_at) AS at FROM outbox_queue WHERE status=?',
          'pending',
        )
      )?.at ?? null
    );
  }
  async syncedSets(id: SessionId, offset: number) {
    await this.writes;
    const rows = await this.db.getAllAsync<{ payload: string }>(
      'SELECT payload FROM performed_sets WHERE session_id=? AND synced=1 ORDER BY rowid LIMIT 50 OFFSET ?',
      id,
      offset,
    );
    return rows.map((row) => PerformedSet.parse(JSON.parse(row.payload)));
  }
}
