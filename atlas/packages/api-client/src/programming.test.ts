import { randomUUID } from 'node:crypto';
import { describe, it, expect, vi } from 'vitest';
import { UpdatePlanInput, WorkoutDay, WorkoutPlan } from '@atlas/contracts';
import { createMockStore } from './mock/store.js';
import { MockProgrammingAdapter } from './mock/programming.mock.js';
import { defaultMockConfig } from './mock/runtime.js';
import { HttpProgrammingAdapter } from './http/programming.http.js';
import { HttpClient } from './http/http-client.js';
function setup() {
  const store = createMockStore({ ...defaultMockConfig, latencyMs: 0, errorRate: 0 });
  store.plans = [];
  return { store, api: new MockProgrammingAdapter(store) };
}
describe('editor de fichas — ATL-PRG-001..005', () => {
  it('bloqueia publicação sem dias e com dia vazio', async () => {
    const { api } = setup();
    const plan = await api.createPlan({ name: 'Ficha demo', goal: 'strength' });
    await expect(api.publishPlan(plan.id)).rejects.toMatchObject({ code: 'validation' });
    const input = UpdatePlanInput.parse({
      ...plan,
      days: [{ id: randomUUID(), label: 'Dia A', slot: 1, estimatedMinutes: 0, exercises: [] }],
    });
    await api.updatePlan(plan.id, input);
    await expect(api.publishPlan(plan.id)).rejects.toMatchObject({ code: 'validation' });
    await expect(api.activatePlan(plan.id)).rejects.toMatchObject({ code: 'validation' });
  });
  it('preserva a versão publicada, isola revisões e reflete ativação em Hoje', async () => {
    const store = createMockStore({ ...defaultMockConfig, latencyMs: 0, errorRate: 0 });
    const api = new MockProgrammingAdapter(store);
    const original = await api.getPlan(store.plans.find((p) => p.status === 'published')!.id);
    await expect(
      api.updatePlan(original.id, UpdatePlanInput.parse(original)),
    ).rejects.toMatchObject({ code: 'conflict' });
    const revision = await api.revisePlan(original.id);
    expect(revision.version).toBe(original.version + 1);
    expect(revision.id).not.toBe(original.id);
    const update = UpdatePlanInput.parse({ ...revision, name: 'Minha revisão' });
    update.days[0]!.exercises.reverse();
    update.days[0]!.exercises.forEach((ex, i) => {
      ex.order = i + 1;
    });
    await api.updatePlan(revision.id, update);
    await api.publishPlan(revision.id);
    await api.activatePlan(revision.id);
    expect((await api.getPlan(original.id)).days).toEqual(original.days);
    expect((await api.getTodayWorkout())?.planName).toBe('Minha revisão');
    expect(WorkoutPlan.safeParse(await api.getPlan(revision.id)).success).toBe(true);
  });
  it('envia a edição validada para a rota HTTP equivalente', async () => {
    const { api } = setup();
    const plan = await api.createPlan({ name: 'Ficha demo', goal: 'strength' });
    const input = UpdatePlanInput.parse(plan);
    const request = vi
      .fn()
      .mockImplementation(() =>
        new Response(JSON.stringify(plan), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', request);
    try {
      const http = new HttpProgrammingAdapter(new HttpClient({ baseUrl: 'https://example.test' }));
      await http.updatePlan(plan.id, input);
      expect(request.mock.calls[0]?.[0]).toBe(
        'https://example.test/api/v1/workout-plans/' + plan.id,
      );
      expect(request.mock.calls[0]?.[1]).toMatchObject({
        method: 'PUT',
        body: JSON.stringify(input),
      });
      await http.revisePlan(plan.id);
      expect(request.mock.calls[1]?.[0]).toContain('/revisions');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('rejeita um dia fora do contrato', () => {
    expect(
      WorkoutDay.safeParse({
        id: randomUUID(),
        label: 'A',
        slot: 9,
        estimatedMinutes: 0,
        exercises: [],
      }).success,
    ).toBe(false);
  });
});
