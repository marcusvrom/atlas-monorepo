import { z } from 'zod';
import { CurrentGoal, UpdateProfileInput } from './identity.js';
import { RecordMeasurementInput } from './measurement.js';

/**
 * Rascunho do primeiro acesso.
 *
 * A ordem dos passos é produto, não capricho: identidade (quem é você e como
 * quer aparecer), objetivo (para onde vai), preferências (com que corpo e que
 * equipamento), disponibilidade (quanto tempo) e ponto de partida (de onde).
 * As preferências entram **depois** do objetivo porque a pergunta sobre
 * limitação só faz sentido quando já se sabe o que a pessoa quer treinar, e
 * **antes** da disponibilidade porque é ela que define o catálogo que o usuário
 * verá na primeira ficha.
 */
export const OnboardingDraft = z.object({
  step: z.enum(['profile', 'goal', 'preferences', 'availability', 'baseline', 'complete']),
  profile: UpdateProfileInput,
  /** URI local da foto escolhida no primeiro acesso. `null` = usa as iniciais. */
  photoUri: z.string().min(1).nullable().default(null),
  goal: CurrentGoal.nullable(),
  baseline: RecordMeasurementInput.nullable(),
});
export type OnboardingDraft = z.infer<typeof OnboardingDraft>;
