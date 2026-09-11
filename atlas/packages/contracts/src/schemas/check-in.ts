import { z } from 'zod';
import { Instant } from '../primitives.js';
/** ATL-UI-012: autorrelato diário, sem interpretação clínica automática. */
export const CheckInInput = z
  .object({
    clientGeneratedId: z.uuid(),
    date: z.iso.date(),
    sleepHours: z.number().min(0).max(24).nullable(),
    sleepQuality: z.number().int().min(1).max(5).nullable(),
    energy: z.number().int().min(1).max(5).nullable(),
    painLevel: z.number().int().min(0).max(10).nullable(),
    status: z.enum(['draft', 'completed']),
  })
  .refine(
    (value) =>
      value.status === 'draft' ||
      (value.sleepHours !== null && value.sleepQuality !== null && value.energy !== null),
    { message: 'Complete os campos de sono e energia.' },
  );
export type CheckInInput = z.infer<typeof CheckInInput>;
export const CheckInEntry = CheckInInput.safeExtend({ updatedAt: Instant });
export type CheckInEntry = z.infer<typeof CheckInEntry>;
export const CheckInRange = z
  .object({ fromDate: z.iso.date(), toDate: z.iso.date() })
  .refine((value) => value.fromDate <= value.toDate, { message: 'Intervalo inválido.' });
export type CheckInRange = z.infer<typeof CheckInRange>;
export const CheckInList = z.array(CheckInEntry);
