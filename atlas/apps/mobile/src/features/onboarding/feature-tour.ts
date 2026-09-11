/**
 * ATL-ONB-002 — registro de features do produto.
 *
 * Esta é a **fonte única** do que o app oferece. O tour de primeiro acesso, a
 * central de ajuda e o gate de CI (`scripts/check-tour-coverage.mjs`) leem
 * daqui — nenhum deles mantém a sua própria lista.
 *
 * A regra que dá sentido ao arquivo: **toda tela nova de usuário precisa estar
 * coberta por alguma feature registrada aqui, ou explicitamente dispensada**.
 * O gate falha o build quando uma rota aparece sem cobertura, o que transforma
 * "lembrar de atualizar o onboarding" num erro de CI em vez de uma boa
 * intenção. Ver `docs/specs/14-onboarding-e-tour.md`.
 *
 * Sem React e sem import de runtime: o gate carrega este módulo direto com o
 * type-stripping do Node, e qualquer dependência de componente quebraria isso.
 */

/** Momento em que a feature é apresentada. */
export type TourStage =
  /** Entra no tour de primeiro acesso, antes do usuário chegar ao app. */
  | 'firstRun'
  /** Não entra no tour; é apresentada no contexto, quando o usuário chega lá. */
  | 'contextual';

export interface TourFeature {
  /** Estável — é o que a persistência grava. Renomear invalida o histórico. */
  readonly id: string;
  readonly titleKey: string;
  readonly bodyKey: string;
  /** Glifo da capa gerada (ver design/media/cover-art.ts). */
  readonly glyph: string;
  /** Para onde o "ver agora" leva. `null` quando a feature não tem tela própria. */
  readonly route: string | null;
  /** Entitlement exigido, quando a feature é paga. */
  readonly requiredFeature: string | null;
  readonly stage: TourStage;
  /**
   * Rotas de `apps/mobile/app` cobertas por esta feature, sem extensão.
   * É o que o gate de CI confere.
   */
  readonly routes: readonly string[];
}

export const featureTour: readonly TourFeature[] = [
  {
    id: 'today',
    titleKey: 'tourTodayTitle',
    bodyKey: 'tourTodayBody',
    glyph: 'dumbbell',
    route: '/(tabs)',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['(tabs)/index'],
  },
  {
    id: 'session',
    titleKey: 'tourSessionTitle',
    bodyKey: 'tourSessionBody',
    glyph: 'barbell',
    route: null,
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['session/[id]'],
  },
  {
    id: 'plans',
    titleKey: 'tourPlansTitle',
    bodyKey: 'tourPlansBody',
    glyph: 'barbell',
    route: '/(tabs)/plans',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['(tabs)/plans', 'plan/new', 'plan/[id]', 'plan/[id]/edit', 'plan/[id]/day/[dayId]'],
  },
  {
    id: 'catalog',
    titleKey: 'tourCatalogTitle',
    bodyKey: 'tourCatalogBody',
    glyph: 'kettlebell',
    route: '/exercises',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['exercises/index', 'exercise/[id]'],
  },
  {
    id: 'progress',
    titleKey: 'tourProgressTitle',
    bodyKey: 'tourProgressBody',
    glyph: 'pulse',
    route: '/(tabs)/progress',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['(tabs)/progress', 'history'],
  },
  {
    id: 'measurements',
    titleKey: 'tourMeasurementsTitle',
    bodyKey: 'tourMeasurementsBody',
    glyph: 'pulse',
    route: '/measurement/new',
    requiredFeature: null,
    stage: 'contextual',
    routes: ['measurement/new'],
  },
  {
    id: 'checkIn',
    titleKey: 'tourCheckInTitle',
    bodyKey: 'tourCheckInBody',
    glyph: 'rings',
    route: '/check-in',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['check-in'],
  },
  {
    id: 'nutrition',
    titleKey: 'tourNutritionTitle',
    bodyKey: 'tourNutritionBody',
    glyph: 'flame',
    route: '/nutrition',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['nutrition'],
  },
  {
    id: 'hydration',
    titleKey: 'tourHydrationTitle',
    bodyKey: 'tourHydrationBody',
    glyph: 'rings',
    // Sem rota própria: a hidratação vive dentro de Hoje e de Metas.
    route: '/nutrition',
    requiredFeature: null,
    stage: 'contextual',
    routes: [],
  },
  {
    id: 'coach',
    titleKey: 'tourCoachTitle',
    bodyKey: 'tourCoachBody',
    glyph: 'rings',
    route: '/(tabs)/coach',
    requiredFeature: null,
    stage: 'firstRun',
    routes: ['(tabs)/coach', 'professional/[id]', 'client/[id]'],
  },
  {
    id: 'avatar',
    titleKey: 'tourAvatarTitle',
    bodyKey: 'tourAvatarBody',
    glyph: 'none',
    route: '/avatar/edit',
    requiredFeature: null,
    stage: 'contextual',
    routes: ['avatar/edit', '(tabs)/profile'],
  },
  {
    id: 'offline',
    titleKey: 'tourOfflineTitle',
    bodyKey: 'tourOfflineBody',
    glyph: 'bolt',
    route: null,
    requiredFeature: null,
    stage: 'firstRun',
    routes: [],
  },
  {
    id: 'pro',
    titleKey: 'tourProTitle',
    bodyKey: 'tourProBody',
    glyph: 'trophy',
    route: '/paywall',
    requiredFeature: 'premiumAvatarItems',
    stage: 'firstRun',
    routes: ['paywall'],
  },
];

/**
 * Rotas que NÃO precisam de feature no registro, e por quê.
 *
 * A lista é curta de propósito: cada entrada é uma dispensa consciente, com
 * justificativa. Crescer aqui em vez de registrar a feature é como o gate
 * deixa de valer alguma coisa.
 */
export const TOUR_EXEMPT_ROUTES: Readonly<Record<string, string>> = {
  _layout: 'Layout, não é tela.',
  '(tabs)/_layout': 'Layout da navegação por abas.',
  '(tabs)/_layout.web': 'Layout da prévia web.',
  '(auth)/welcome': 'É o próprio onboarding.',
  '(auth)/sign-in': 'É o próprio onboarding.',
  '(auth)/onboarding/index': 'É o próprio onboarding.',
  '(auth)/tour': 'É o próprio tour.',
  dev: 'Ferramenta de desenvolvimento, fora do produto.',
  'dev/design-system': 'Ferramenta de desenvolvimento, fora do produto.',
};

export const firstRunFeatures = featureTour.filter((feature) => feature.stage === 'firstRun');

/** Versão do tour. Subir força o tour a reaparecer para quem já o viu. */
export const TOUR_VERSION = 1;
