import { describe, it, expect, vi, afterEach } from 'vitest';
import { CheckInInput } from '@atlas/contracts';
import { createMockStore } from './mock/store.js';
import { defaultMockConfig } from './mock/runtime.js';
import { MockWellbeingAdapter } from './mock/wellbeing.mock.js';
import { HttpWellbeingAdapter } from './http/wellbeing.http.js';
import { HttpClient } from './http/http-client.js';
afterEach(() => vi.unstubAllGlobals());
for (const mode of ['mock', 'http'])
  describe('ATL-UI-012 check-in ' + mode, () => {
    const create = () => {
      const mock = new MockWellbeingAdapter(
        createMockStore({ ...defaultMockConfig, latencyMs: 0, errorRate: 0 }),
      );
      if (mode === 'mock') return mock;
      vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
        const path = new URL(url);
        const value =
          init.method === 'PUT'
            ? await mock.upsertCheckIn(JSON.parse(String(init.body)))
            : await mock.listCheckIns({
                fromDate: path.searchParams.get('fromDate')!,
                toDate: path.searchParams.get('toDate')!,
              });
        return new Response(JSON.stringify(value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
      return new HttpWellbeingAdapter(new HttpClient({ baseUrl: 'https://atlas.test' }));
    };
    it('retoma rascunho, conclui, atualiza a data e reenvio não duplica', async () => {
      const port = create();
      const draft = CheckInInput.parse({
        clientGeneratedId: crypto.randomUUID(),
        date: '2026-09-10',
        sleepHours: 7.5,
        sleepQuality: 4,
        energy: null,
        painLevel: null,
        status: 'draft',
      });
      await port.upsertCheckIn(draft);
      const completed = {
        ...draft,
        clientGeneratedId: crypto.randomUUID(),
        energy: 4,
        status: 'completed' as const,
      };
      const first = await port.upsertCheckIn(completed);
      expect(await port.upsertCheckIn(completed)).toEqual(first);
      const entries = await port.listCheckIns({ fromDate: '2026-09-04', toDate: '2026-09-10' });
      expect(entries).toHaveLength(1);
      expect(entries[0]!.status).toBe('completed');
      expect(
        await port.listCheckIns({ fromDate: '2026-09-01', toDate: '2026-09-09' }),
      ).toHaveLength(0);
    });
    it('rejeita escala inválida e conclusão incompleta nos dois adapters', async () => {
      const port = create();
      const input = {
        clientGeneratedId: crypto.randomUUID(),
        date: '2026-09-10',
        sleepHours: 7,
        sleepQuality: 6,
        energy: 4,
        painLevel: null,
        status: 'completed' as const,
      };
      await expect(port.upsertCheckIn(input)).rejects.toThrow();
      await expect(
        port.upsertCheckIn({ ...input, sleepQuality: 4, energy: null }),
      ).rejects.toThrow();
    });
  });
