import {
  ClientDetail,
  ClientOverview,
  CoachingEngagement,
  ProfessionalDetail,
  ProfessionalSearchFilter,
  ProfessionalSummary,
  ShareScope,
  page,
  type Page,
  type UserId,
} from '@atlas/contracts';
import { ApiError } from '../errors.js';
import type { CoachingPort } from '../ports/coaching.port.js';
import { simulate, createRandom, uuidV4From } from './runtime.js';
import type { MockStore } from './store.js';
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export class MockCoachingAdapter implements CoachingPort {
  private engagements = new Map<string, CoachingEngagement>();
  private clients: ClientOverview[];
  constructor(private readonly store: MockStore) {
    const random = createRandom(store.config.seed + 10);
    this.clients = [...store.clientOverviews];
    while (this.clients.length < 60) {
      const index = this.clients.length;
      const source = store.clientOverviews[index % store.clientOverviews.length]!;
      this.clients.push(
        ClientOverview.parse({
          ...source,
          athleteId: uuidV4From(random),
          displayName:
            source.displayName + ' ' + (Math.floor(index / store.clientOverviews.length) + 1),
          riskScore: random() * 0.5,
          goalsAtRisk: 0,
        }),
      );
    }
    for (const client of this.clients) {
      const engagement = CoachingEngagement.parse({
        id: client.athleteId,
        professionalId: store.me.id,
        professionalName: store.me.displayName,
        athleteId: client.athleteId,
        athleteName: client.displayName,
        status: 'active',
        scope: {
          workouts: true,
          measurements: true,
          photos: false,
          painReports: false,
          wearables: false,
        },
        startedAt: new Date().toISOString(),
        endsAt: null,
      });
      this.engagements.set(engagement.id, engagement);
    }
  }
  async searchProfessionals(value: ProfessionalSearchFilter): Promise<Page<ProfessionalSummary>> {
    const filter = ProfessionalSearchFilter.parse(value);
    return simulate(this.store.config, () => {
      const items = this.store.professionals.filter(
        (item) =>
          (!filter.query ||
            normalize(item.displayName + ' ' + item.headline + ' ' + item.city).includes(
              normalize(filter.query),
            )) &&
          (!filter.specialty || item.specialties.includes(filter.specialty)) &&
          (!filter.modality || item.modality === filter.modality) &&
          (!filter.maxPriceBrl || item.monthlyPriceBrl <= filter.maxPriceBrl) &&
          (!filter.maxDistanceKm ||
            (item.distanceKm !== null && item.distanceKm <= filter.maxDistanceKm)),
      );
      const start = Number(filter.cursor ?? 0);
      return page(ProfessionalSummary).parse({
        items: items.slice(start, start + filter.limit),
        nextCursor: start + filter.limit < items.length ? String(start + filter.limit) : null,
      });
    });
  }
  async getProfessional(id: UserId): Promise<ProfessionalSummary> {
    return simulate(this.store.config, () => {
      const found = this.store.professionals.find((item) => item.id === id);
      if (!found) throw ApiError.notFound('Profissional');
      return ProfessionalSummary.parse(found);
    });
  }
  async getProfessionalDetail(id: UserId): Promise<ProfessionalDetail> {
    const summary = await this.getProfessional(id);
    const random = createRandom(this.store.config.seed);
    return ProfessionalDetail.parse({
      ...summary,
      bio: 'Perfil de demonstração. Acompanhamento individual com planejamento adaptado à rotina e aos objetivos acordados.',
      reviews: [
        {
          id: uuidV4From(random),
          displayName: 'Pessoa da comunidade (demo)',
          rating: 5,
          comment: 'Planejamento claro e acompanhamento atento durante as sessões.',
          createdAt: new Date().toISOString(),
        },
      ],
      cancellationPolicy:
        'Demonstração: o cancelamento pode ser solicitado antes da próxima renovação mensal. Nenhuma cobrança é realizada neste app.',
    });
  }
  async listMyEngagements(): Promise<CoachingEngagement[]> {
    return simulate(this.store.config, () =>
      [...this.engagements.values()].map((item) => CoachingEngagement.parse(item)),
    );
  }
  async updateShareScope(id: string, value: ShareScope): Promise<CoachingEngagement> {
    return simulate(this.store.config, () => {
      const current = this.engagements.get(id);
      if (!current) throw ApiError.notFound('Acompanhamento');
      const result = CoachingEngagement.parse({ ...current, scope: ShareScope.parse(value) });
      this.engagements.set(id, result);
      return result;
    });
  }
  private scoped(client: ClientOverview) {
    const scope = this.engagements.get(client.athleteId)!.scope;
    return ClientOverview.parse({
      ...client,
      ...(!scope.measurements ? { weightDelta30dKg: null, leanMassDelta30dKg: null } : {}),
      ...(!scope.workouts ? { adherence7d: 0, adherence30d: 0, lastSessionAt: null } : {}),
    });
  }
  async listClients(params?: {
    status?: 'active' | 'paused' | 'ended';
    sort?: 'risk' | 'name' | 'lastSession';
  }): Promise<ClientOverview[]> {
    return simulate(this.store.config, () =>
      this.clients
        .slice(0, this.store.config.clientCount ?? 24)
        .filter(
          (client) =>
            !params?.status || this.engagements.get(client.athleteId)?.status === params.status,
        )
        .map((client) => this.scoped(client))
        .sort((a, b) =>
          params?.sort === 'name'
            ? a.displayName.localeCompare(b.displayName, 'pt-BR')
            : params?.sort === 'lastSession'
              ? Date.parse(b.lastSessionAt ?? '1970-01-01') -
                Date.parse(a.lastSessionAt ?? '1970-01-01')
              : b.riskScore - a.riskScore,
        ),
    );
  }
  async getClientOverview(id: UserId): Promise<ClientOverview> {
    return simulate(this.store.config, () => {
      const client = this.clients.find((item) => item.athleteId === id);
      if (!client) throw ApiError.notFound('Aluno');
      return this.scoped(client);
    });
  }
  async getClientDetail(id: UserId): Promise<ClientDetail> {
    const overview = await this.getClientOverview(id);
    const engagement = this.engagements.get(id)!;
    return ClientDetail.parse({
      overview,
      engagement,
      goal: {
        type: overview.goal,
        targetDate: null,
        targetWeightKg: null,
        targetBodyFatPct: null,
        weeklySessionTarget: 3,
      },
      notes: ['Registro fictício para demonstração: revisar disponibilidade na próxima conversa.'],
      ...(engagement.scope.workouts
        ? {
            sessions: this.store.sessions
              .slice(0, 3)
              .map(({ sets, ...session }) => ({
                ...session,
                setCount: sets.length,
                exerciseCount: new Set(sets.map((set) => set.exerciseId)).size,
              })),
          }
        : {}),
      ...(engagement.scope.measurements
        ? { measurements: this.store.measurements.slice(0, 3) }
        : {}),
    });
  }
}
