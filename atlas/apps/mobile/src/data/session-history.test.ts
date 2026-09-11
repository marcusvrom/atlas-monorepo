import { expect, it, vi } from 'vitest';
import { SessionSummary } from '@atlas/contracts';
import { fetchSessionSummaries } from './session-history';
const items = Array.from({length:75}, () => SessionSummary.parse({id:crypto.randomUUID(),planId:null,planVersion:null,dayLabel:'Treino',status:'completed',startedAt:'2026-09-10T10:00:00Z',completedAt:'2026-09-10T11:00:00Z',durationSeconds:3600,totalVolumeKg:100,setCount:3,exerciseCount:1}));
it('ATL-UI-012 carrega todas as páginas de sessões', async () => {
  const listSessions = vi.fn().mockResolvedValueOnce({items:items.slice(0,50),nextCursor:'page2'}).mockResolvedValueOnce({items:items.slice(50),nextCursor:null});
  expect(await fetchSessionSummaries({listSessions})).toHaveLength(75);
  expect(listSessions).toHaveBeenLastCalledWith({cursor:'page2',limit:50});
});
it('ATL-UI-012 interrompe cursor repetido sem loop infinito', async () => {
  const listSessions = vi.fn().mockResolvedValue({items:[],nextCursor:'same'});
  await expect(fetchSessionSummaries({listSessions})).rejects.toThrow('repeated cursor');
  expect(listSessions).toHaveBeenCalledTimes(2);
});
