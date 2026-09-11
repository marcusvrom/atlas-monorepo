import { ApiError, type SessionPort } from '@atlas/api-client';
import { LogSetsResult, type OutboxRecord, type SessionId } from '@atlas/contracts';
import { OfflineStore } from './store';
export function retryDelay(attempt: number, random = Math.random) {
  return Math.min(300000, 1000 * 2 ** Math.min(attempt, 19)) * (0.5 + random() * 0.5);
}
export class SyncEngine {
  private running: Promise<void> | undefined;
  private restored = new Set<SessionId>();
  constructor(
    private readonly store: OfflineStore,
    private readonly port: SessionPort,
    private readonly changed: () => void = () => {},
  ) {}
  flush() {
    this.running ??= this.drain().finally(() => {
      this.running = undefined;
      this.changed();
    });
    return this.running;
  }
  private async restore(id: SessionId) {
    if (this.restored.has(id)) return;
    const local = await this.store.local(id);
    if (!local) throw new Error('ATL-SES-004: missing session');
    await this.port.startSession(local.start);
    for (let offset = 0; ; offset += 50) {
      const sets = await this.store.syncedSets(id, offset);
      if (!sets.length) break;
      await this.port.logSets(id, sets);
    }
    this.restored.add(id);
  }
  private async drain() {
    for (;;) {
      const records = await this.store.take(Date.now());
      if (!records.length) return;
      const first = records[0]!;
      let batch: OutboxRecord[] = [first];
      if (first.operation.kind === 'set')
        batch = records.filter(
          (row) =>
            row.operation.kind === 'set' && row.operation.sessionId === first.operation.sessionId,
        );
      try {
        await this.restore(first.operation.sessionId);
        if (first.operation.kind === 'set') {
          const sets = batch.flatMap((row) =>
            row.operation.kind === 'set' ? [row.operation.set] : [],
          );
          const result = LogSetsResult.parse(
            await this.port.logSets(first.operation.sessionId, sets),
          );
          const known = new Set(batch.map((row) => row.operation.id));
          const settled = [
            ...result.accepted,
            ...result.duplicated,
            ...result.rejected.map((item) => item.clientGeneratedId),
          ];
          if (new Set(settled).size !== known.size || settled.length !== known.size || settled.some((id) => !known.has(id)))
            throw new ApiError('server', 'ATL-SES-004: incomplete acknowledgement');
          await this.store.acknowledge(
            [...result.accepted, ...result.duplicated],
            result.rejected.map((item) => item.clientGeneratedId),
          );
        } else {
          if (first.operation.kind === 'complete')
            await this.port.completeSession(first.operation.sessionId);
          await this.store.acknowledge([first.operation.id]);
        }
      } catch (error) {
        if (error instanceof ApiError && !error.isRetryable) {
          await this.store.acknowledge(
            [],
            batch.map((row) => row.operation.id),
          );
        } else {
          await this.store.retry(
            batch,
            Date.now() + retryDelay(Math.max(...batch.map((row) => row.attempts))),
          );
          return;
        }
      }
      this.changed();
    }
  }
}
