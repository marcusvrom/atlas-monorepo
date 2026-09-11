import type {
  ClientOverview,
  ClientDetail,
  ProfessionalDetail,
  CoachingEngagement,
  Page,
  ProfessionalSearchFilter,
  ProfessionalSummary,
  ShareScope,
  UserId,
} from '@atlas/contracts';

export interface CoachingPort {
  /** Marketplace — visão do atleta. */
  searchProfessionals(filter: ProfessionalSearchFilter): Promise<Page<ProfessionalSummary>>;
  getProfessionalDetail(id:UserId):Promise<ProfessionalDetail>;
  getClientDetail(id:UserId):Promise<ClientDetail>;
  getProfessional(id: UserId): Promise<ProfessionalSummary>;
  listMyEngagements(): Promise<CoachingEngagement[]>;
  updateShareScope(engagementId: string, scope: ShareScope): Promise<CoachingEngagement>;

  /** Painel — visão do profissional. Ordenado por riskScore. Ver spec 00 §11.5. */
  listClients(params?: {
    status?: 'active' | 'paused' | 'ended';
    sort?: 'risk' | 'name' | 'lastSession';
  }): Promise<ClientOverview[]>;
  getClientOverview(athleteId: UserId): Promise<ClientOverview>;
}
