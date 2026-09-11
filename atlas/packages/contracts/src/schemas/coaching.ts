import {SessionSummary} from './session.js';
import {MeasurementEntry} from './measurement.js';
import {CurrentGoal} from './identity.js';
import { z } from 'zod';
import { EngagementId, GoalType, Instant, UserId } from '../primitives.js';

export const Specialty = z.enum([
  'hypertrophy', 'strength', 'weightLoss', 'physiotherapy',
  'postural', 'sportsPerformance', 'elderly', 'prenatal',
]);
export type Specialty = z.infer<typeof Specialty>;

export const Modality = z.enum(['online', 'inPerson', 'hybrid']);
export type Modality = z.infer<typeof Modality>;

export const ProfessionalSummary = z.object({
  id: UserId,
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  headline: z.string(),
  credentialLabel: z.string(),
  specialties: z.array(Specialty).min(1),
  modality: Modality,
  city: z.string(),
  distanceKm: z.number().min(0).nullable(),
  monthlyPriceBrl: z.number().min(0),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
  responseRate: z.number().min(0).max(1),
  acceptingClients: z.boolean(),
});
export type ProfessionalSummary = z.infer<typeof ProfessionalSummary>;

/**
 * Escopo de compartilhamento. O atleta escolhe o que o profissional vê.
 * Enforced no backend, no repositório — não na UI. Ver spec 00 §15.2.
 */
export const ShareScope = z.object({
  workouts: z.boolean(),
  measurements: z.boolean(),
  photos: z.boolean(),
  painReports: z.boolean(),
  wearables: z.boolean(),
});
export type ShareScope = z.infer<typeof ShareScope>;

export const EngagementStatus = z.enum(['trial', 'active', 'paused', 'ended']);
export type EngagementStatus = z.infer<typeof EngagementStatus>;

export const CoachingEngagement = z.object({
  id: EngagementId,
  professionalId: UserId,
  professionalName: z.string(),
  athleteId: UserId,
  athleteName: z.string(),
  status: EngagementStatus,
  scope: ShareScope,
  startedAt: Instant,
  endsAt: Instant.nullable(),
});
export type CoachingEngagement = z.infer<typeof CoachingEngagement>;

/** Read model do painel do coach. Uma query, N alunos. Ver spec 00 §11.5. */
export const ClientOverview = z.object({
  athleteId: UserId,
  displayName: z.string(),
  avatarUrl: z.url().nullable(),
  goal: GoalType,
  adherence7d: z.number().min(0).max(1),
  adherence30d: z.number().min(0).max(1),
  lastSessionAt: Instant.nullable(),
  weightDelta30dKg: z.number().nullable(),
  leanMassDelta30dKg: z.number().nullable(),
  goalsAtRisk: z.number().int().min(0),
  unreadMessages: z.number().int().min(0),
  /** 0..1. Ordena a atenção do profissional pelo que mais importa. */
  riskScore: z.number().min(0).max(1),
});
export type ClientOverview = z.infer<typeof ClientOverview>;

export const ProfessionalSearchFilter = z.object({
  query: z.string().optional(),
  specialty: Specialty.optional(),
  modality: Modality.optional(),
  maxDistanceKm: z.number().positive().optional(),
  maxPriceBrl: z.number().positive().optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ProfessionalSearchFilter = z.input<typeof ProfessionalSearchFilter>;

export const ProfessionalReview=z.object({id:z.uuid(),displayName:z.string(),rating:z.number().min(0).max(5),comment:z.string(),createdAt:Instant});
export type ProfessionalReview=z.infer<typeof ProfessionalReview>;
export const ProfessionalDetail=ProfessionalSummary.extend({bio:z.string(),reviews:z.array(ProfessionalReview),cancellationPolicy:z.string()});
export type ProfessionalDetail=z.infer<typeof ProfessionalDetail>;
export const ClientDetail=z.object({overview:ClientOverview,engagement:CoachingEngagement,goal:CurrentGoal,notes:z.array(z.string()),sessions:z.array(SessionSummary).optional(),measurements:z.array(MeasurementEntry).optional()});
export type ClientDetail=z.infer<typeof ClientDetail>;
