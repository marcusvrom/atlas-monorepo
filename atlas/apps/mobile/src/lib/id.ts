import * as Crypto from 'expo-crypto';

/** PR 0: UUIDv4 autorizado como exceção temporária à R7. */
export function newId(): string {
  return Crypto.randomUUID();
}
