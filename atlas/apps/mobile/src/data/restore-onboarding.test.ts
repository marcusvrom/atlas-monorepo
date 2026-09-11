import { describe, expect, it } from 'vitest';
import { createApiClient } from '@atlas/api-client';
import { OnboardingDraft } from '@atlas/contracts';
import { restoreOnboarding } from './restore-onboarding';
describe('retomada do onboarding', () => {
  it('restaura perfil e objetivo após reinício sem duplicar a medida inicial', async () => {
    const api = createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });
    const draft = OnboardingDraft.parse({
      step: 'complete',
      profile: { displayName: 'Demo', heightCm: 170, birthDate: null },
      goal: {
        type: 'strength',
        targetDate: null,
        targetWeightKg: null,
        targetBodyFatPct: null,
        weeklySessionTarget: 4,
      },
      baseline: {
        clientGeneratedId: '01900000-0000-4000-8000-000000000001',
        takenAt: '2026-09-09T12:00:00.000Z',
        weightKg: 70,
        bodyFatPct: null,
        circumferences: null,
        notes: null,
      },
    });
    await restoreOnboarding(api, JSON.parse(JSON.stringify(draft)));
    await restoreOnboarding(api, draft);
    const me = await api.identity.getMe();
    expect(me.displayName).toBe('Demo');
    expect(me.goal?.type).toBe('strength');
    expect(
      (await api.measurement.list({ limit: 1000 })).items.filter(
        (x) => x.id === draft.baseline?.clientGeneratedId,
      ),
    ).toHaveLength(1);
  });
  it('aceita passos opcionais omitidos e rejeita checkpoint corrompido antes de gravar', async () => {
    const api = createApiClient({ mode: 'mock', mock: { latencyMs: 0, errorRate: 0 } });
    const draft = OnboardingDraft.parse({
      step: 'complete',
      profile: { displayName: 'Demo', heightCm: null, birthDate: null },
      goal: null,
      baseline: null,
    });
    expect((await restoreOnboarding(api, draft)).baseline).toBeNull();
    expect(OnboardingDraft.safeParse({ ...draft, step: 'invalid' }).success).toBe(false);
    await expect(api.identity.updateProfile({ ...draft.profile, heightCm: -1 })).rejects.toThrow();
  });
});
