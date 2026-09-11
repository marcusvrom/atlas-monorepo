import {z} from 'zod';
import {SessionId} from '../primitives.js';
import {PerformedSet,StartSessionInput,TrainingSession} from './session.js';
export const LocalSessionHeader=TrainingSession.omit({sets:true});
export type LocalSessionHeader=z.infer<typeof LocalSessionHeader>;
export const LocalSession= z.object({header:LocalSessionHeader,start:StartSessionInput,restEndsAt:z.number().nonnegative(),deviceClockSkewMs:z.number().finite()});
export type LocalSession=z.infer<typeof LocalSession>;
export const OfflineOperation=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('start'),id:z.uuid(),sessionId:SessionId,input:StartSessionInput}),
 z.object({kind:z.literal('set'),id:z.uuid(),sessionId:SessionId,set:PerformedSet}),
 z.object({kind:z.literal('complete'),id:z.uuid(),sessionId:SessionId}),
]);
export type OfflineOperation=z.infer<typeof OfflineOperation>;
export const OutboxRecord=z.object({sequence:z.number().int().nonnegative(),operation:OfflineOperation,attempts:z.number().int().nonnegative(),nextAttemptAt:z.number().nonnegative(),status:z.enum(['pending','rejected'])});
export type OutboxRecord=z.infer<typeof OutboxRecord>;
