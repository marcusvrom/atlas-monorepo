import { PerformedSet, TrainingSession, type SessionId } from '@atlas/contracts';
import type { SessionPort } from '@atlas/api-client';
import { totalVolume } from '@atlas/domain';
/** ATL-UI-003: operações pendentes, nunca uma cópia do estado remoto. */
export class SessionPendingQueue {
  private pending = new Map<SessionId, Map<string, PerformedSet>>();
  private rejected = new Map<SessionId, Map<string, PerformedSet>>();
  private completed = new Map<SessionId, string>();
  private running = new Map<SessionId, Promise<void>>();
  private listeners = new Set<() => void>();
  private revision = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.revision;
  private emit() {
    this.revision++;
    for (const listener of this.listeners) listener();
  }
  enqueue(id: SessionId, sets: PerformedSet[]) {
    const entries = this.pending.get(id) ?? new Map<string, PerformedSet>();
    for (const value of sets) {
      const set = PerformedSet.parse(value);
      entries.set(set.clientGeneratedId, set);
    }
    this.pending.set(id, entries);
    this.emit();
  }
  complete(id: SessionId, at: string) {
    this.completed.set(id, at);
    this.emit();
  }
  pendingSets(id: SessionId) {
    return [...(this.pending.get(id)?.values() ?? [])];
  }
  persisted(id: SessionId, ids: string[]) {
    for (const key of ids) this.pending.get(id)?.delete(key);
    this.emit();
  }
  count(id: SessionId) {
    return (this.pending.get(id)?.size ?? 0) + (this.completed.has(id) ? 1 : 0);
  }
  rejectedCount(id: SessionId) {
    return this.rejected.get(id)?.size ?? 0;
  }
  merge(value: TrainingSession): TrainingSession {
    const session = TrainingSession.parse(value);
    const sets = new Map(session.sets.map((set) => [set.clientGeneratedId, set]));
    for (const set of this.pending.get(session.id)?.values() ?? [])
      sets.set(set.clientGeneratedId, set);
    for (const set of this.rejected.get(session.id)?.values() ?? [])
      sets.set(set.clientGeneratedId, set);
    const all = [...sets.values()];
    const completedAt = this.completed.get(session.id) ?? session.completedAt;
    return TrainingSession.parse({
      ...session,
      sets: all,
      totalVolumeKg: totalVolume(all),
      ...(completedAt
        ? {
            status: 'completed',
            completedAt,
            durationSeconds: Math.max(
              0,
              Math.round((Date.parse(completedAt) - Date.parse(session.startedAt)) / 1000),
            ),
          }
        : {}),
    });
  }
  flush(port: SessionPort, id: SessionId): Promise<void> {
    const existing = this.running.get(id);
    if (existing) return existing;
    const work = this.drain(port, id).finally(() => this.running.delete(id));
    this.running.set(id, work);
    return work;
  }
  private async drain(port: SessionPort, id: SessionId) {
    while (this.pending.get(id)?.size) {
      const batch = [...this.pending.get(id)!.values()].slice(0, 50);
      const result = await port.logSets(id, batch);
      const rejected = this.rejected.get(id) ?? new Map<string, PerformedSet>();
      for (const entry of result.rejected) {
        const set = this.pending.get(id)?.get(entry.clientGeneratedId);
        if (set) rejected.set(entry.clientGeneratedId, set);
      }
      this.rejected.set(id, rejected);
      const ids = [
        ...result.accepted,
        ...result.duplicated,
        ...result.rejected.map((item) => item.clientGeneratedId),
      ];
      if (!ids.length) throw new Error('ATL-UI-003: empty acknowledgement');
      for (const key of ids) this.pending.get(id)?.delete(key);
      this.emit();
    }
    if (this.completed.has(id)) {
      await port.completeSession(id);
      this.completed.delete(id);
      this.emit();
    }
  }
}
export const sessionPending = new SessionPendingQueue();
