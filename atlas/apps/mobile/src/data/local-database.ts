import * as SQLite from 'expo-sqlite';
// ATL-SES-004: serializa a inicialização do módulo SQLite compartilhado.
let opening: Promise<unknown> = Promise.resolve();
export function openLocalDatabase(name: string) {
  const result = opening.then(() => SQLite.openDatabaseAsync(name));
  opening = result.catch(() => {});
  return result;
}
