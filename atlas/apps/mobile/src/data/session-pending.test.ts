import {randomUUID} from 'node:crypto';
import {describe,it,expect,vi} from 'vitest';
import {createApiClient} from '@atlas/api-client';
import {PerformedSet} from '@atlas/contracts';
import {SessionPendingQueue} from './session-pending';
import {remainingRest} from '../features/session/session-summary';
async function setup(){const runtime={seed:42,latencyMs:0,errorRate:0};const api=createApiClient({mode:'mock',mockRuntime:runtime});const session=await api.session.startSession({clientGeneratedId:randomUUID(),planId:null,dayId:null});const exercise=(await api.catalog.listExercises({limit:1})).items[0]!;const set=PerformedSet.parse({clientGeneratedId:randomUUID(),exerciseId:exercise.id,order:1,weightKg:10,reps:10,durationSeconds:null,rpe:null,rir:2,isWarmup:false,painLevel:null,performedAt:new Date().toISOString()});return {api,runtime,session,set,queue:new SessionPendingQueue()};}
describe('ATL-UI-003: registro sem perda',()=>{
 it('preserva 25 séries e volume com erro total, reconciliando quando o mock volta',async()=>{
  const {api,runtime,session,set,queue}=await setup();runtime.errorRate=1;
  queue.enqueue(session.id,Array.from({length:25},(_,i)=>({...set,clientGeneratedId:randomUUID(),order:i+1})));
  await expect(queue.flush(api.session,session.id)).rejects.toThrow();
  const visible=queue.merge(session);expect(visible.sets).toHaveLength(25);expect(visible.totalVolumeKg).toBe(2500);
  runtime.errorRate=0;await queue.flush(api.session,session.id);expect(queue.count(session.id)).toBe(0);expect((await api.session.getSession(session.id)).sets).toHaveLength(25);
 });
 it('atualiza sem esperar três segundos e deduplica o reenvio',async()=>{
  const {api,runtime,session,set,queue}=await setup();vi.useFakeTimers();runtime.latencyMs=3000;
  try{queue.enqueue(session.id,[set,set]);const flushing=queue.flush(api.session,session.id);expect(queue.merge(session).sets).toHaveLength(1);expect(queue.merge(session).totalVolumeKg).toBe(100);await vi.runAllTimersAsync();await flushing;runtime.latencyMs=0;vi.useRealTimers();queue.enqueue(session.id,[set]);await queue.flush(api.session,session.id);expect((await api.session.getSession(session.id)).sets).toHaveLength(1);}finally{vi.useRealTimers();}
 });
 it('um item rejeitado não impede o restante, mantendo o rejeitado visível',async()=>{
  const {api,session,set,queue}=await setup();queue.enqueue(session.id,[set,{...set,clientGeneratedId:randomUUID(),exerciseId:randomUUID() as typeof set.exerciseId}]);await queue.flush(api.session,session.id);expect(queue.count(session.id)).toBe(0);expect(queue.rejectedCount(session.id)).toBe(1);expect(queue.merge(await api.session.getSession(session.id)).sets).toHaveLength(2);
 });
 it('timer deriva do prazo absoluto após cinco minutos em segundo plano',()=>{const start=Date.now();expect(remainingRest(start+360000,start+300000)).toBe(60);expect(remainingRest(start+60000,start+300000)).toBe(0);});
});
