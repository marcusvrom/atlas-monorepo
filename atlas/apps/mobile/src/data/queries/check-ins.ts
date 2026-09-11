import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckInInput, CheckInEntry } from '@atlas/contracts';
import { useApi } from '../api-provider';
import { savedCheckIns, persistCheckIn } from '../check-in-storage';
export function useCheckIns(fromDate: string, toDate: string) {
  const api = useApi();
  return useQuery({
    queryKey: ['check-ins', fromDate, toDate],
    queryFn: async () => {
      const saved = await savedCheckIns();
      if (api.mode === 'mock')
        for (const entry of saved) await api.wellbeing.upsertCheckIn(CheckInInput.parse(entry));
      return api.wellbeing.listCheckIns({ fromDate, toDate });
    },
  });
}
export function useSaveCheckIn() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckInInput) => {
      const valid = CheckInInput.parse(input);
      await persistCheckIn(CheckInEntry.parse({ ...valid, updatedAt: new Date().toISOString() }));
      const result = await api.wellbeing.upsertCheckIn(valid);
      await persistCheckIn(result);
      return result;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ['check-ins'] }),
  });
}
