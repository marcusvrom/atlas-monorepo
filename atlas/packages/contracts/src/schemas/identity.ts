import { z } from 'zod';
import { GoalType, Instant, UserId } from '../primitives.js';
import { ActivityLevel, BiologicalSex } from './nutrition.js';

export const AvatarConfig = z.object({
  /**
   * Foto do usuário (URI local do device: file://, ph://, content://). Quando
   * presente, é o que se renderiza; o construtor vetorial abaixo fica como
   * fallback/alternativa. Opcional com default null para não quebrar avatares
   * já persistidos. Ver docs/design/sessao-2026-09-10-repaginacao.md.
   */
  photoUri: z.string().min(1).nullable().default(null),
  base: z.string(),
  skinTone: z.string(),
  hair: z.string(),
  face: z.string(),
  outfit: z.string(),
  accessory: z.string().nullable(),
  frame: z.string().nullable(),
  background: z.string(),

  /**
   * ATL-AVT-002 — cor separada da forma.
   *
   * Antes a cor de cabelo, roupa e fundo era **derivada do índice da peça**:
   * escolher "roupa 4" escolhia forma e cor de uma vez, e as oito "roupas" eram
   * na prática duas formas repetidas em quatro cores. Quem quisesse a regata na
   * cor da camiseta não tinha como pedir.
   *
   * Nulo = usa a cor padrão da peça, que é exatamente o comportamento antigo.
   * Por isso o campo é opcional com default `null`: avatares já persistidos
   * continuam válidos e renderizam igual. Ver `avatar-assets.ts`.
   */
  hairColor: z.string().nullable().default(null),
  outfitColor: z.string().nullable().default(null),
  backgroundColor: z.string().nullable().default(null),
});
export type AvatarConfig = z.infer<typeof AvatarConfig>;

export const CurrentGoal = z.object({
  type: GoalType,
  targetDate: Instant.nullable(),
  targetWeightKg: z.number().min(20).max(400).nullable(),
  targetBodyFatPct: z.number().min(5).max(60).nullable(),
  weeklySessionTarget: z.number().int().min(1).max(14),
});
export type CurrentGoal = z.infer<typeof CurrentGoal>;

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
  'premiumAvatarItems',
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
  avatar: AvatarConfig,
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
  planKey: PlanKey,
  entitlements: z.array(Entitlement),
  createdAt: Instant,
});
export type UserProfile = z.infer<typeof UserProfile>;

/** PR 2: edição dos dados básicos do perfil, sem autenticação real. */
export const UpdateProfileInput = UserProfile.pick({
  displayName: true,
  heightCm: true,
  birthDate: true,
  biologicalSex: true,
  activityLevel: true,
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>;

/** ATL-BIL-001: evento mínimo, sem dados de saúde ou conteúdo pessoal. */
export const PaywallEvent = z.strictObject({ feature: Feature, plan: PlanKey });
export type PaywallEvent = z.infer<typeof PaywallEvent>;
