import { CheckInEntry, CheckInList } from '@atlas/contracts';
import { openLocalDatabase } from './local-database';
let database: ReturnType<typeof openLocalDatabase> | undefined;
async function db() {
  database ??= openLocalDatabase('atlas-check-ins.db')
    .then(async (value) => {
      await value.execAsync(
        'CREATE TABLE IF NOT EXISTS check_ins(date TEXT PRIMARY KEY,payload TEXT NOT NULL)',
      );
      return value;
    })
    .catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  return database;
}
export async function savedCheckIns() {
  const rows = await (
    await db()
  ).getAllAsync<{ payload: string }>('SELECT payload FROM check_ins ORDER BY date DESC');
  return CheckInList.parse(rows.map((row) => JSON.parse(row.payload)));
}
export async function persistCheckIn(entry: CheckInEntry) {
  const valid = CheckInEntry.parse(entry);
  await (
    await db()
  ).runAsync(
    'INSERT OR REPLACE INTO check_ins(date,payload) VALUES(?,?)',
    valid.date,
    JSON.stringify(valid),
  );
}
