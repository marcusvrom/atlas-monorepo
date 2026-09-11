import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@atlas/api-client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Catálogo é praticamente imutável; dado de treino muda a cada sessão.
        // O staleTime por query sobrescreve este default quando necessário.
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) return error.isRetryable && failureCount < 3;
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: (failureCount, error) =>
          error instanceof ApiError && error.isRetryable && failureCount < 2,
      },
    },
  });
}
