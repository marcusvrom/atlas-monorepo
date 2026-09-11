import { randomUUID } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import { createApiClient, defaultMockConfig } from './index';
it('changes errors and latency without losing sessions or idempotency', async () => {
  const runtime = { ...defaultMockConfig, latencyMs: 0 };
  const api = createApiClient({ mode: 'mock', mockRuntime: runtime });
  const input = { clientGeneratedId: randomUUID(), planId: null, dayId: null };
  const session = await api.session.startSession(input);
  runtime.errorRate = 1;
  await expect(api.session.getSession(session.id)).rejects.toMatchObject({ code: 'network' });
  runtime.errorRate = 0;
  expect((await api.session.startSession(input)).id).toBe(session.id);
  vi.useFakeTimers();
  try {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    runtime.latencyMs = 3000;
    const resolved = vi.fn();
    const request = api.session.getSession(session.id).then(resolved);
    await vi.advanceTimersByTimeAsync(2999);
    expect(resolved).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await request;
    expect(resolved).toHaveBeenCalledOnce();
  } finally {
    vi.useRealTimers();
    vi.restoreAllMocks();
  }
});
