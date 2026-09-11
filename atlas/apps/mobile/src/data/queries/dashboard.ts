import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchSessionSummaries } from '../session-history';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';
import { getOfflineStore } from '../../offline/database';
export function useDashboardSessions() {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.session.all, 'dashboard'],
    queryFn: async () => {
      const remote = await fetchSessionSummaries(api.session);
      const local = await (await getOfflineStore()).summaries();
      const merged = new Map(remote.map((session) => [session.id, session]));
      for (const session of local) merged.set(session.id, session);
      return [...merged.values()].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
    },
    staleTime: 30000,
  });
}
export function useHistoryPages() {
  const api = useApi();
  return useInfiniteQuery({
    queryKey: [...queryKeys.session.list, 'pages'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.session.listSessions({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
