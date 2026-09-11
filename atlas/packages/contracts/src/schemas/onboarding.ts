import { z } from 'zod';
import { CurrentGoal, UpdateProfileInput } from './identity.js';
import { RecordMeasurementInput } from './measurement.js';
export const OnboardingDraft = z.object({
  step: z.enum(['profile', 'goal', 'availability', 'baseline', 'complete']),
  profile: UpdateProfileInput,
  goal: CurrentGoal.nullable(),
  baseline: RecordMeasurementInput.nullable(),
});
export type OnboardingDraft = z.infer<typeof OnboardingDraft>;
