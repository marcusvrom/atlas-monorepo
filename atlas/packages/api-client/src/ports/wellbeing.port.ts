import type { CheckInEntry, CheckInInput, CheckInRange } from '@atlas/contracts';
export interface WellbeingPort {
  listCheckIns(range: CheckInRange): Promise<CheckInEntry[]>;
  upsertCheckIn(input: CheckInInput): Promise<CheckInEntry>;
}
