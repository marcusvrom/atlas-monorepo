import {
  ProfessionalDetail as ProfessionalDetailSchema,
  ClientDetail as ClientDetailSchema,
  type ClientDetail,
  type ProfessionalDetail,
  UserProfile as ProfileSchema,
  UpdateProfileInput as ProfileInputSchema,
  type UpdateProfileInput,
  type AvatarConfig,
  type ClientOverview,
  type CoachingEngagement,
  type CurrentGoal,
  type Entitlement,
  type ExerciseId,
  type ExerciseProgression,
  type Feature,
  type AdherenceSummary,
  type MeasurementEntry,
  type MetricKey,
  type MetricSeries,
  type MuscleVolume,
  type Page,
  type ProfessionalSearchFilter,
  type ProfessionalSummary,
  type RecordMeasurementInput,
  type ShareScope,
  type UserId,
  type UserProfile,
} from '@atlas/contracts';
import { NotImplementedError } from '../errors.js';
import type { CoachingPort } from '../ports/coaching.port.js';
import type { IdentityPort } from '../ports/identity.port.js';
import type { InsightsPort } from '../ports/insights.port.js';
import type { MeasurementPort } from '../ports/measurement.port.js';
import type { HttpClient } from './http-client.js';

/**
 * Adapters HTTP ainda não implementados — Fase 2.
 *
 * Existem como classes reais, e não como ausência, para manter a PARIDADE
 * estrutural com os adapters mock exigida em AGENTS.md R3: adicionar um método
 * ao port quebra o build aqui, e não silenciosamente em runtime.
 *
 * Cada método referencia a task-spec que o implementa, e a rota alvo já está
 * declarada em ROUTES — é isso que mantém o gate de paridade de contrato
 * (scripts/check-contract-parity.mjs) verde antes da implementação existir.
 */

const ROUTES = {
  me: '/api/v1/me',
  entitlements: '/api/v1/me/entitlements',
  measurements: '/api/v1/measurements',
  measurementSeries: '/api/v1/measurements/series',
  muscleVolume: '/api/v1/insights/muscle-volume',
  adherence: '/api/v1/insights/adherence',
  professionalSearch: '/api/v1/professionals/search',
  coachClients: '/api/v1/coach/clients',
} as const;

export class HttpMeasurementAdapter implements MeasurementPort {
  constructor(private readonly http: HttpClient) {}
  /** ATL-BDY-001 → POST {@link ROUTES.measurements} */
  record(_input: RecordMeasurementInput): Promise<MeasurementEntry> {
    void ROUTES.measurements;
    throw new NotImplementedError('HttpMeasurementAdapter', 'record', 'ATL-BDY-001');
  }
  list(_params?: { cursor?: string | null; limit?: number }): Promise<Page<MeasurementEntry>> {
    throw new NotImplementedError('HttpMeasurementAdapter', 'list', 'ATL-BDY-002');
  }
  /** ATL-BDY-003 → GET {@link ROUTES.measurementSeries} */
  getSeries(_params: {
    metric: MetricKey;
    fromIso: string;
    toIso: string;
    smoothing?: 'none' | 'ma7';
  }): Promise<MetricSeries> {
    void ROUTES.measurementSeries;
    throw new NotImplementedError('HttpMeasurementAdapter', 'getSeries', 'ATL-BDY-003');
  }
}

export class HttpInsightsAdapter implements InsightsPort {
  constructor(private readonly http: HttpClient) {}
  /** ATL-INS-001 → GET {@link ROUTES.muscleVolume} */
  getMuscleVolume(_params: { periodDays: 7 | 30 | 90 }): Promise<MuscleVolume[]> {
    void ROUTES.muscleVolume;
    throw new NotImplementedError('HttpInsightsAdapter', 'getMuscleVolume', 'ATL-INS-001');
  }
  /** ATL-INS-002 → GET {@link ROUTES.adherence} */
  getAdherence(_params: { periodDays: 7 | 30 | 90 }): Promise<AdherenceSummary> {
    void ROUTES.adherence;
    throw new NotImplementedError('HttpInsightsAdapter', 'getAdherence', 'ATL-INS-002');
  }
  getExerciseProgression(_exerciseId: ExerciseId): Promise<ExerciseProgression> {
    throw new NotImplementedError('HttpInsightsAdapter', 'getExerciseProgression', 'ATL-INS-003');
  }
}

export class HttpCoachingAdapter implements CoachingPort {
  getProfessionalDetail(id: UserId): Promise<ProfessionalDetail> {
    return this.http.request(`/api/v1/professionals/${id}`, ProfessionalDetailSchema);
  }
  getClientDetail(id: UserId): Promise<ClientDetail> {
    return this.http.request(`/api/v1/coach/clients/${id}`, ClientDetailSchema);
  }

  constructor(private readonly http: HttpClient) {}
  /** ATL-MKT-001 → GET {@link ROUTES.professionalSearch} */
  searchProfessionals(_filter: ProfessionalSearchFilter): Promise<Page<ProfessionalSummary>> {
    void ROUTES.professionalSearch;
    throw new NotImplementedError('HttpCoachingAdapter', 'searchProfessionals', 'ATL-MKT-001');
  }
  getProfessional(_id: UserId): Promise<ProfessionalSummary> {
    throw new NotImplementedError('HttpCoachingAdapter', 'getProfessional', 'ATL-MKT-002');
  }
  listMyEngagements(): Promise<CoachingEngagement[]> {
    throw new NotImplementedError('HttpCoachingAdapter', 'listMyEngagements', 'ATL-COA-001');
  }
  updateShareScope(_engagementId: string, _scope: ShareScope): Promise<CoachingEngagement> {
    throw new NotImplementedError('HttpCoachingAdapter', 'updateShareScope', 'ATL-COA-004');
  }
  /** ATL-COA-002 → GET {@link ROUTES.coachClients} */
  listClients(_params?: {
    status?: 'active' | 'paused' | 'ended';
    sort?: 'risk' | 'name' | 'lastSession';
  }): Promise<ClientOverview[]> {
    void ROUTES.coachClients;
    throw new NotImplementedError('HttpCoachingAdapter', 'listClients', 'ATL-COA-002');
  }
  getClientOverview(_athleteId: UserId): Promise<ClientOverview> {
    throw new NotImplementedError('HttpCoachingAdapter', 'getClientOverview', 'ATL-COA-003');
  }
}

export class HttpIdentityAdapter implements IdentityPort {
  updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return this.http.request('/api/v1/me', ProfileSchema, {
      method: 'PATCH',
      body: ProfileInputSchema.parse(input),
    });
  }
  constructor(private readonly http: HttpClient) {}
  /** ATL-IDN-002 → GET {@link ROUTES.me} */
  getMe(): Promise<UserProfile> {
    void ROUTES.me;
    throw new NotImplementedError('HttpIdentityAdapter', 'getMe', 'ATL-IDN-002');
  }
  updateGoal(_goal: CurrentGoal): Promise<UserProfile> {
    throw new NotImplementedError('HttpIdentityAdapter', 'updateGoal', 'ATL-IDN-003');
  }
  updateAvatar(_avatar: AvatarConfig): Promise<UserProfile> {
    throw new NotImplementedError('HttpIdentityAdapter', 'updateAvatar', 'ATL-AVT-002');
  }
  /** ATL-BIL-002 → GET {@link ROUTES.entitlements} */
  listEntitlements(): Promise<Entitlement[]> {
    void ROUTES.entitlements;
    throw new NotImplementedError('HttpIdentityAdapter', 'listEntitlements', 'ATL-BIL-002');
  }
  hasEntitlement(_feature: Feature): Promise<boolean> {
    throw new NotImplementedError('HttpIdentityAdapter', 'hasEntitlement', 'ATL-BIL-002');
  }
}
