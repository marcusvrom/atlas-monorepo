import { z } from 'zod';
import {
  BodyRegion,
  Equipment,
  ExperienceLevel,
  GoalType,
  Instant,
  UserId,
} from '../primitives.js';
import { ActivityLevel, BiologicalSex } from './nutrition.js';

/**
 * Foto de perfil.
 *
 * O construtor de avatar vetorial (base, cabelo, rosto, roupa, acessório,
 * moldura, três cores e um paywall de peças) foi removido. Ele custava um
 * catálogo inteiro de geometria, uma tela de edição, um item de entitlement e
 * uma etapa a mais na jornada — para entregar um boneco que ninguém confunde
 * com a própria cara. Foto do usuário resolve identificação, que é a única
 * função que o retrato tem aqui, e `PersonAvatar` já sabe cair para as
 * iniciais quando não há foto.
 *
 * A URI é local do device (file://, ph://, content://) enquanto não há upload:
 * o campo é o mesmo que o backend vai preencher com uma URL remota depois, e o
 * componente não distingue os dois casos.
 */
export const ProfilePhoto = z.string().min(1).nullable();
export type ProfilePhoto = z.infer<typeof ProfilePhoto>;

export const CurrentGoal = z.object({
  type: GoalType,
  targetDate: Instant.nullable(),
  targetWeightKg: z.number().min(20).max(400).nullable(),
  targetBodyFatPct: z.number().min(5).max(60).nullable(),
  weeklySessionTarget: z.number().int().min(1).max(14),
});
export type CurrentGoal = z.infer<typeof CurrentGoal>;

/**
 * Preferências de treino — o que personaliza o catálogo e a montagem de ficha.
 *
 * Separado de `CurrentGoal` porque responde a outra pergunta: o objetivo diz
 * *para onde* a pessoa vai, as preferências dizem *com que corpo e com que
 * equipamento* ela vai. Objetivo muda quando a meta é atingida; uma limitação
 * de joelho não.
 */
export const TrainingPreferences = z.object({
  experienceLevel: ExperienceLevel,
  /**
   * Regiões que o usuário pediu para poupar. Lista vazia é a resposta "nenhuma"
   * — e é diferente de nunca ter respondido, que é o `null` no perfil.
   */
  protectedRegions: z.array(BodyRegion).default([]),
  /**
   * Equipamento disponível. `null` = sem restrição (academia completa), que é
   * diferente de `[]` = nada disponível. Um array vazio existir como estado
   * distinto é o que permite "só peso do corpo" ser dito sem ambiguidade.
   */
  availableEquipment: z.array(Equipment).nullable().default(null),
});
export type TrainingPreferences = z.infer<typeof TrainingPreferences>;

export const PlanKey = z.enum(['free', 'pro', 'coachStarter', 'coachPro']);
export type PlanKey = z.infer<typeof PlanKey>;

export const Feature = z.enum([
  'activeWorkoutPlans',
  'customExercises',
  'fullHistory',
  'advancedInsights',
  'bodyCompositionTracking',
  'progressPhotos',
  'interactiveAnatomy',
  'activeClients',
  'videoCallHours',
  'whiteLabelReports',
]);
export type Feature = z.infer<typeof Feature>;

/**
 * Contrato público do billing. Nenhuma tela pergunta "o plano é Pro?" —
 * pergunta "tem direito a X?". Ver spec 00 §4.8.
 */
export const Entitlement = z.object({
  feature: Feature,
  /** null = ilimitado. 0 = bloqueado. */
  limit: z.number().int().min(0).nullable(),
  used: z.number().int().min(0),
});
export type Entitlement = z.infer<typeof Entitlement>;

export const UserProfile = z.object({
  id: UserId,
  displayName: z.string(),
  email: z.email(),
  photoUri: ProfilePhoto.default(null),
  roles: z.array(z.enum(['athlete', 'professional', 'admin'])).min(1),
  goal: CurrentGoal.nullable(),
  heightCm: z.number().min(80).max(260).nullable(),
  birthDate: z.string().nullable(),
  /**
   * ATL-NUT-001 — entradas da estimativa metabólica. Anuláveis com default
   * `null` porque o perfil existia antes delas: quem nunca preencheu continua
   * válido, e `DailyTargets.missingInputs` diz à tela o que ainda falta em vez
   * de o app inventar um valor médio e apresentá-lo como se fosse do usuário.
   */
  biologicalSex: BiologicalSex.nullable().default(null),
  activityLevel: ActivityLevel.nullable().default(null),
  /**
   * `null` = o usuário ainda não respondeu, e o app não deve fingir que sabe:
   * sem preferências, o catálogo mostra tudo, sem filtro silencioso. Anulável
   * com default pelo mesmo motivo dos campos acima — perfis criados antes desta
   * etapa continuam válidos.
   */
  trainingPreferences: TrainingPreferences.nullable().default(null),
  planKey: PlanKey,
  entitlements: z.array(Entitlement),
  createdAt: Instant,
});
export type UserProfile = z.infer<typeof UserProfile>;

/**
 * PR 2: edição dos dados básicos do perfil, sem autenticação real.
 *
 * As preferências entram aqui, e não num endpoint próprio, porque são parte do
 * perfil: um `PATCH /api/v1/me` já é a operação certa, e um port novo só
 * acrescentaria superfície para manter em paridade nos dois adapters sem
 * nenhum ganho de expressividade.
 */
export const UpdateProfileInput = UserProfile.pick({
  displayName: true,
  heightCm: true,
  birthDate: true,
  biologicalSex: true,
  activityLevel: true,
  trainingPreferences: true,
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>;

/** ATL-BIL-001: evento mínimo, sem dados de saúde ou conteúdo pessoal. */
export const PaywallEvent = z.strictObject({ feature: Feature, plan: PlanKey });
export type PaywallEvent = z.infer<typeof PaywallEvent>;
