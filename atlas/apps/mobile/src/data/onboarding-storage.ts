import type * as SQLite from 'expo-sqlite';
import { openLocalDatabase } from './local-database';
import { OnboardingDraft } from '@atlas/contracts';
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ??= openLocalDatabase('atlas-onboarding.db').then(async (instance) => {
    await instance.execAsync(
      'CREATE TABLE IF NOT EXISTS onboarding (id INTEGER PRIMARY KEY, payload TEXT NOT NULL)',
    );
    return instance;
  }).catch((error:unknown)=>{database=undefined;throw error;});
  return database;
}
export async function readOnboarding(): Promise<OnboardingDraft | null> {
  const row = await (
    await db()
  ).getFirstAsync<{ payload: string }>('SELECT payload FROM onboarding WHERE id = 1');
  return row ? OnboardingDraft.parse(JSON.parse(row.payload)) : null;
}
export async function saveOnboarding(value: OnboardingDraft): Promise<void> {
  const parsed = OnboardingDraft.parse(value);
  await (
    await db()
  ).runAsync(
    'INSERT INTO onboarding (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
    JSON.stringify(parsed),
  );
}
