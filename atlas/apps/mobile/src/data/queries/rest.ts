import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionId } from '@atlas/contracts';
import { getOfflineStore } from '../../offline/database';
export function useRestDeadline(id: SessionId) {
  const cache = useQueryClient();
  const key = ['rest', id];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await (await getOfflineStore()).local(id))?.restEndsAt ?? 0,
  });
  const save = useMutation({
    mutationFn: async (at: number) => (await getOfflineStore()).setRest(id, at),
    onMutate: (at) => {
      cache.setQueryData(key, at);
    },
  });
  return { deadline: query.data ?? 0, set: (at: number) => save.mutate(at) };
}
