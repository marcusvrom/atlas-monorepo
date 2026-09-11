import { CheckInEntry, CheckInInput, CheckInRange, CheckInList } from '@atlas/contracts';
import type { WellbeingPort } from '../ports/wellbeing.port.js';
import type { MockStore } from './store.js';
import { simulate } from './runtime.js';
export class MockWellbeingAdapter implements WellbeingPort {
  constructor(private readonly store: MockStore) {}
  async listCheckIns(range: CheckInRange): Promise<CheckInEntry[]> {
    const params = CheckInRange.parse(range);
    return simulate(this.store.config, () =>
      CheckInList.parse(
        [...this.store.checkIns.values()]
          .filter((item) => item.date >= params.fromDate && item.date <= params.toDate)
          .sort((a, b) => b.date.localeCompare(a.date)),
      ),
    );
  }
  async upsertCheckIn(input: CheckInInput): Promise<CheckInEntry> {
    const valid = CheckInInput.parse(input);
    return simulate(this.store.config, () => {
      const prior = this.store.checkInWrites.get(valid.clientGeneratedId);
      if (prior) return CheckInEntry.parse(prior);
      const entry = CheckInEntry.parse({ ...valid, updatedAt: new Date().toISOString() });
      this.store.checkIns.set(entry.date, entry);
      this.store.checkInWrites.set(valid.clientGeneratedId, entry);
      return CheckInEntry.parse(entry);
    });
  }
}
