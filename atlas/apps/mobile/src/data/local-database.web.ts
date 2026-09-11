import * as SQLite from 'expo-sqlite';
// ATL-UI-012: SQLite WASM compartilha um worker; operações completas não se sobrepõem.
let operations: Promise<unknown> = Promise.resolve();
function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const result = operations.then(work);
  operations = result.catch(() => {});
  return result;
}
export async function openLocalDatabase(name: string): Promise<SQLite.SQLiteDatabase> {
  const database = await enqueue(() => SQLite.openDatabaseAsync(name));
  const serialized = new Set([
    'execAsync',
    'runAsync',
    'getAllAsync',
    'getFirstAsync',
    'closeAsync',
  ]);
  return new Proxy(database, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property);
      if (typeof value !== 'function') return value;
      if (property === 'execAsync')
        return (sql: string) =>
          enqueue(() => target.execAsync(sql.replace('journal_mode=WAL', 'journal_mode=DELETE')));
      if (property === 'runAsync') {
        return (source: string, ...params: SQLite.SQLiteBindValue[]) =>
          enqueue(async () => {
            const statement = await target.prepareAsync(source);
            let failed = false;
            try {
              return await statement.executeAsync(...params);
            } catch (error) {
              failed = true;
              throw error;
            } finally {
              if (failed) await statement.finalizeAsync().catch(() => {});
              else await statement.finalizeAsync();
            }
          });
      }
      if (serialized.has(String(property))) {
        return (...args: unknown[]) => enqueue(() => Reflect.apply(value, target, args));
      }
      return value.bind(target);
    },
  });
}
