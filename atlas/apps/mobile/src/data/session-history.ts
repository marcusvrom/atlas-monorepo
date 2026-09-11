import { SessionSummary, page } from '@atlas/contracts';
import type { SessionPort } from '@atlas/api-client';
export async function fetchSessionSummaries(port: Pick<SessionPort, 'listSessions'>) {
  const sessions: SessionSummary[] = [];
  let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const result = page(SessionSummary).parse(await port.listSessions({cursor, limit:50}));
    sessions.push(...result.items);
    cursor = result.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error('ATL-UI-012: repeated cursor');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return sessions;
}
