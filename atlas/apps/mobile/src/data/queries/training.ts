import { getOfflineStore } from '../../offline/database';
import { kickSync } from '../../offline/coordinator';
import { newId } from '../../lib/id';
import { useSyncExternalStore } from 'react';
import { sessionPending } from '../session-pending';
import {
  TrainingSession,
  SessionId as SessionIdSchema,
  type PerformedSet,
  type SessionId,
  type StartSessionInput,
} from '@atlas/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';

export function useTodayWorkout() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.programming.today,
    queryFn: async () => {
      const today = await api.programming.getTodayWorkout();
      if (!today) return null;
      const store = await getOfflineStore();
      for (const raw of await store.recent()) {
        const local = await store.local(SessionIdSchema.parse(raw));
        if (local?.header.planId === today.planId)
          return {
            ...today,
            inProgressSessionId: local.header.status === 'inProgress' ? local.header.id : null,
          };
      }
      return today;
    },
    staleTime: 5 * 60_000,
  });
}

export function usePlans(status?: 'draft' | 'published' | 'archived') {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.programming.plans(status),
    queryFn: () => api.programming.listPlans(status ? { status } : undefined),
  });
}

export function useCreatePlan() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.programming.createPlan.bind(api.programming),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.programming.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements });
    },
    // Erro 'quotaExceeded' NÃO é tratado aqui: a tela reage a ele abrindo o
    // paywall contextual. Nenhuma tela decide regra de plano. Ver spec 30 §3.
  });
}

export function useSession(id: SessionId | undefined) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.session.detail(id ?? 'none'),
    queryFn: async () => {
      const store = await getOfflineStore();
      const local = await store.session(id!);
      if (local) return sessionPending.merge(local);
      const remote = await api.session.getSession(id!);
      await store.saveSession(
        remote,
        { clientGeneratedId: remote.id, planId: remote.planId, dayId: null },
        false,
      );
      return sessionPending.merge(remote);
    },
    enabled: id !== undefined,
    staleTime: 0,
  });
}

export function useStartSession() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartSessionInput) => {
      const today = queryClient.getQueryData<import('@atlas/contracts').TodayWorkout | null>(
        queryKeys.programming.today,
      );
      const store=await getOfflineStore();
      const plan=input.planId?(queryClient.getQueryData<import('@atlas/contracts').WorkoutPlan>(queryKeys.programming.plan(input.planId))??await store.cachedPlan(input.planId)??await api.programming.getPlan(input.planId)):null;
      if(plan)await store.cachePlan(plan);
      const session = TrainingSession.parse({
        id: input.clientGeneratedId,
        planId: input.planId,
        planVersion: plan?.version ?? null,
        dayLabel:
          plan?.days.find((day) => day.id === input.dayId)?.label ??
          today?.day.label ??
          'Treino livre',
        status: 'inProgress',
        startedAt: new Date().toISOString(),
        completedAt: null,
        sets: [],
        totalVolumeKg: 0,
        durationSeconds: 0,
      });
      await (await getOfflineStore()).saveSession(session, input);
      void kickSync(api, queryClient).catch(() => {});
      return session;
    },
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.session.detail(session.id), session);
      void queryClient.invalidateQueries({ queryKey: queryKeys.programming.today });
    },
  });
}

/**
 * Registro de série com atualização OTIMISTA.
 *
 * O feedback visual precisa acontecer em ≤ 16 ms — o usuário está com a barra
 * na mão. Esperar rede aqui é inaceitável, e é por isso que `performed_set` é
 * append-only e idempotente: erros preservam a série na fila para reenvio.
 */
export function useLogSets(sessionId: SessionId) {
  const api = useApi(),
    cache = useQueryClient();
  const key = queryKeys.session.detail(sessionId);
  return useMutation({
    mutationFn: async (sets: PerformedSet[]) => {
      await (await getOfflineStore()).enqueueSets(sessionId, sets);
      sessionPending.persisted(
        sessionId,
        sets.map((set) => set.clientGeneratedId),
      );
      void kickSync(api, cache).catch(() => {});
    },
    onMutate: (sets: PerformedSet[]) => {
      void cache.cancelQueries({ queryKey: key });
      sessionPending.enqueue(sessionId, sets);
      cache.setQueryData<TrainingSession>(key, (current) =>
        current ? sessionPending.merge(current) : current,
      );
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: key });
      void cache.invalidateQueries({ queryKey: ['outbox'] });
      void cache.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });
}
export function useSessionQueue(id: SessionId) {
  const api = useApi(),
    cache = useQueryClient();
  useSyncExternalStore(sessionPending.subscribe, sessionPending.snapshot, sessionPending.snapshot);
  const retry = useMutation({
    mutationFn: async () => {
      const store = await getOfflineStore();
      const volatile = sessionPending.pendingSets(id);
      if (volatile.length) {
        await store.enqueueSets(id, volatile);
        sessionPending.persisted(
          id,
          volatile.map((set) => set.clientGeneratedId),
        );
      }
      await kickSync(api, cache);
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: queryKeys.session.detail(id) }),
  });
  const status = useQuery({
    queryKey: ['outbox', id],
    queryFn: async () => (await getOfflineStore()).stats(id),
  });
  return {
    pending: (status.data?.pending ?? 0) + sessionPending.count(id),
    rejected: status.data?.rejected ?? 0,
    retry,
  };
}
export function useSessionHistory() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.session.list,
    queryFn: () => api.session.listSessions({ limit: 50 }),
  });
}
export function useLastSession(planId: string | null, dayLabel: string) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.session.all, 'previous', planId, dayLabel],
    queryFn: async () => {
      const page = await api.session.listSessions({ limit: 50 });
      const previous = page.items.find(
        (item) =>
          item.status === 'completed' && item.planId === planId && item.dayLabel === dayLabel,
      );
      return previous ? api.session.getSession(previous.id) : null;
    },
  });
}

export function useCompleteSession() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: SessionId) => {
      const current = queryClient.getQueryData<TrainingSession>(queryKeys.session.detail(id));
      if (!current) throw new Error('ATL-UI-003: session unavailable');
      const store = await getOfflineStore();
      const pending = sessionPending.pendingSets(id);
      if (pending.length) {
        await store.enqueueSets(id, pending);
        sessionPending.persisted(
          id,
          pending.map((set) => set.clientGeneratedId),
        );
      }
      await store.complete(id, newId(), new Date().toISOString());
      const completed = (await store.session(id))!;
      queryClient.setQueryData(queryKeys.session.detail(id), completed);
      void kickSync(api, queryClient).catch(() => {});
      return completed;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.session.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.programming.today });
    },
  });
}
