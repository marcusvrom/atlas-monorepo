import type * as SQLite from 'expo-sqlite';
import { openLocalDatabase } from './local-database';

/**
 * ATL-ONB-002 — o que o usuário já viu do tour.
 *
 * Local, não remoto, e de propósito: "já vi a apresentação" é estado do
 * aparelho, não do perfil. Sincronizar isso obrigaria a tela de primeiro acesso
 * a esperar a rede antes de decidir se aparece — e o primeiro acesso é
 * justamente o momento em que a rede é menos confiável.
 *
 * Guarda a versão vista, não um booleano: subir `TOUR_VERSION` quando entra uma
 * feature relevante faz o tour reaparecer para quem já o tinha visto, que é o
 * comportamento que a spec 14 exige.
 */
let database: Promise<SQLite.SQLiteDatabase> | undefined;

async function db() {
  database ??= openLocalDatabase('atlas-tour.db')
    .then(async (instance) => {
      await instance.execAsync(
        'CREATE TABLE IF NOT EXISTS tour (id INTEGER PRIMARY KEY, version INTEGER NOT NULL)',
      );
      return instance;
    })
    .catch((error: unknown) => {
      database = undefined;
      throw error;
    });
  return database;
}

/** Versão do tour já vista, ou 0 para quem nunca viu. */
export async function seenTourVersion(): Promise<number> {
  try {
    const row = await (
      await db()
    ).getFirstAsync<{ version: number }>('SELECT version FROM tour WHERE id = 1');
    return row?.version ?? 0;
  } catch {
    // Falha de storage não pode impedir o app de abrir. Tratamos como
    // "nunca viu": mostrar o tour de novo é um incômodo pequeno; travar a
    // entrada do app não é.
    return 0;
  }
}

export async function markTourSeen(version: number): Promise<void> {
  try {
    await (
      await db()
    ).runAsync(
      'INSERT INTO tour (id, version) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET version = excluded.version',
      version,
    );
  } catch {
    // Mesmo raciocínio: não vale derrubar a navegação por causa do registro.
  }
}
