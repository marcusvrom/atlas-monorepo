import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LogWaterInput } from '@atlas/contracts';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

/**
 * ATL-NUT-001 — hooks de metas metabólicas e hidratação.
 *
 * A tela consome daqui e não sabe de onde o dado vem (R1). Note que nenhum hook
 * calcula nada: a estimativa chega pronta do port, que a obtém de
 * `@atlas/domain` no mock e do backend em HTTP.
 */

/** Data local em "YYYY-MM-DD" — o dia de hidratação é do fuso do usuário. */
export function localDay(now = new Date()): string {
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function useDailyTargets() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.nutrition.dailyTargets,
    queryFn: () => api.nutrition.getDailyTargets(),
    // A estimativa só muda quando peso, perfil ou objetivo mudam — não vale
    // refazer a cada foco de tela.
    staleTime: 5 * 60_000,
  });
}

export function useHydrationDay(date: string = localDay()) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.nutrition.hydration(date),
    queryFn: () => api.nutrition.getHydrationDay(date),
  });
}

export function useLogWater() {
  const api = useApi();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: LogWaterInput) => api.nutrition.logWater(input),
    onSuccess: (day) => {
      // A resposta já é o dia inteiro: escrevemos no cache em vez de refazer a
      // consulta, e o anel na tela anda no mesmo frame do toque.
      cache.setQueryData(queryKeys.nutrition.hydration(day.date), day);
    },
  });
}
