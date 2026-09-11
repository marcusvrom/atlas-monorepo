import { CheckInEntry, CheckInInput, CheckInRange, CheckInList } from '@atlas/contracts';
import type { WellbeingPort } from '../ports/wellbeing.port.js';
import type { HttpClient } from './http-client.js';
export class HttpWellbeingAdapter implements WellbeingPort {
  constructor(private readonly http: HttpClient) {}
  async listCheckIns(range: CheckInRange): Promise<CheckInEntry[]> {
    const valid = CheckInRange.parse(range);
    return this.http.request('/api/v1/check-ins', CheckInList, { query: valid });
  }
  async upsertCheckIn(input: CheckInInput): Promise<CheckInEntry> {
    const valid = CheckInInput.parse(input);
    return this.http.request('/api/v1/check-ins/' + valid.date, CheckInEntry, {
      method: 'PUT',
      body: valid,
      idempotencyKey: valid.clientGeneratedId,
    });
  }
}
