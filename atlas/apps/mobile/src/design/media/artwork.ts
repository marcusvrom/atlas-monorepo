import type { CoverGlyph } from './cover-art';

/**
 * Registro de arte editorial — qual imagem pertence a qual momento da jornada.
 *
 * Antes deste arquivo, cada tela importava o `.webp` que achava adequado e
 * decidia sozinha semente e glifo. O resultado era previsível: a mesma foto
 * aparecia com sementes diferentes em telas vizinhas (trocando a cor do
 * fallback no meio do fluxo), e não havia como responder "onde esta imagem é
 * usada?" sem varrer o app. Aqui a pergunta que a tela faz é **semântica** —
 * "qual arte representa 'voltar depois de uns dias'?" — e a resposta é única.
 *
 * Este módulo é deliberadamente livre de `require`: ele descreve a escolha, e
 * `artwork-assets.ts` resolve o binário. Assim a regra editorial é testável em
 * Node, sem empacotador, e trocar um arquivo de imagem não toca a regra.
 *
 * ## Estratégia de reaproveitamento (Opção A)
 *
 * Quatro imagens cobrem onze contextos por **significado**, não por
 * disponibilidade:
 *
 * | Imagem                   | Significado          | Contextos                                            |
 * |--------------------------|----------------------|------------------------------------------------------|
 * | `onboarding-train.webp`  | começar algo         | início da jornada, primeira ficha, sem treino hoje   |
 * | `onboarding-progress.webp`| acumular evidência  | progresso, medidas, histórico, treino concluído      |
 * | `onboarding-coach.webp`  | alguém do seu lado   | login, acompanhamento profissional, retorno          |
 * | `home-workout.webp`      | o treino de hoje     | treino do dia, sessão em andamento                   |
 *
 * ## Requisito de direção de arte (não é preferência estética)
 *
 * Toda imagem adicionada a `assets/marketing/` precisa ser **escura na metade
 * inferior**, onde a tampa de texto do hero assenta. O véu de contraste
 * (`cover.scrim`) sustenta AA sobre a arte vetorial gerada, que é escura por
 * construção, mas nenhum degradê vertical sustenta AA sobre uma fotografia
 * clara sem escurecer o card a ponto de a foto deixar de ser foto. Uma imagem
 * clara aqui quebra WCAG 1.4.3 no título do hero — e quebra em silêncio, porque
 * nada no build reprova. Ver `design/tests/contrast.test.ts`.
 *
 * O que **não** se faz: repetir a mesma arte em cards vizinhos da mesma tela.
 * Por isso `welcome-back` usa a arte de coach e não a de treino — na home ela
 * convive com o hero de `active-workout`, e duas fotos iguais empilhadas leem
 * como falha de carregamento, não como identidade.
 */

/** Arquivos editoriais disponíveis. A chave é o nome, não o caminho. */
export const artworkAssetKeys = [
  'onboardingTrain',
  'onboardingProgress',
  'onboardingCoach',
  'homeWorkout',
] as const;
export type ArtworkAssetKey = (typeof artworkAssetKeys)[number];

/** Momento da jornada. É o que a tela declara — nunca um nome de arquivo. */
export const artworkContexts = [
  'onboarding-training',
  'onboarding-progress',
  'onboarding-coach',
  'sign-in',
  'welcome-back',
  'active-workout',
  'workout-completed',
  'progress-highlight',
  'coach-highlight',
  'empty-plan',
  'nutrition-targets',
] as const;
export type ArtworkContext = (typeof artworkContexts)[number];

/**
 * Proporções das artes editoriais, medidas nos próprios arquivos.
 *
 * Existem como token porque a altura do hero passou a ser **derivada da
 * imagem**, e não escolhida à mão: os assets são retrato (3:4 e 2:3), e a caixa
 * de 212 pt que existia antes cortava mais da metade da altura — a figura
 * central perdia cabeça ou pés dependendo do arquivo. Uma constante por arte é
 * mais verboso que um número único, e é o que evita voltar a cortar quando a
 * próxima imagem tiver outra proporção.
 */
export const ARTWORK_ASPECT = {
  onboardingTrain: 1080 / 1440,
  onboardingProgress: 1080 / 1440,
  onboardingCoach: 1080 / 1440,
  homeWorkout: 960 / 1440,
} as const satisfies Record<ArtworkAssetKey, number>;

/**
 * Proporção de um contexto sem foto, servido só pela arte vetorial. Mais larga
 * que retrato de propósito: a arte gerada não tem figura para preservar, e um
 * bloco de 3:4 só de gradiente ocuparia meia tela sem dizer nada.
 */
export const VECTOR_ASPECT = 4 / 3;

export interface ArtworkSpec {
  /**
   * Semente do fallback vetorial. Estável por contexto: se a foto não carregar,
   * a tela mantém **a mesma** paleta de sempre, e não uma capa sorteada nova a
   * cada montagem.
   */
  seed: string;
  /** Glifo do fallback, escolhido pelo significado do contexto. */
  glyph: CoverGlyph;
  /** `null` quando o contexto vive só de arte vetorial. */
  asset: ArtworkAssetKey | null;
  /**
   * `true` quando a imagem é puro apoio visual e o texto ao lado já diz tudo.
   * Contexto decorativo é escondido de leitor de tela; contexto informativo
   * exige `alt` de quem o usa (ver `HeroArtwork`).
   */
  decorative: boolean;
}

/**
 * Proporção (largura ÷ altura) com que o contexto deve ser desenhado para a
 * imagem aparecer inteira.
 */
export function artworkAspect(context: ArtworkContext): number {
  const asset = REGISTRY[context].asset;
  return asset === null ? VECTOR_ASPECT : ARTWORK_ASPECT[asset];
}

const REGISTRY: Record<ArtworkContext, ArtworkSpec> = {
  'onboarding-training': {
    seed: 'onboarding-train',
    glyph: 'dumbbell',
    asset: 'onboardingTrain',
    decorative: true,
  },
  'onboarding-progress': {
    seed: 'onboarding-progress',
    glyph: 'pulse',
    asset: 'onboardingProgress',
    decorative: true,
  },
  'onboarding-coach': {
    seed: 'onboarding-coach',
    glyph: 'rings',
    asset: 'onboardingCoach',
    decorative: true,
  },
  // Mesma semente e mesma arte da última página de boas-vindas: a entrada
  // continua a capa que o usuário acabou de ver em vez de cortar para outra.
  'sign-in': {
    seed: 'onboarding-coach',
    glyph: 'rings',
    asset: 'onboardingCoach',
    decorative: true,
  },
  'welcome-back': {
    seed: 'welcome-back',
    glyph: 'rings',
    asset: 'onboardingCoach',
    decorative: true,
  },
  'active-workout': {
    seed: 'home-workout',
    glyph: 'dumbbell',
    asset: 'homeWorkout',
    decorative: true,
  },
  'workout-completed': {
    seed: 'workout-completed',
    glyph: 'trophy',
    asset: 'onboardingProgress',
    decorative: true,
  },
  'progress-highlight': {
    seed: 'progress-highlight',
    glyph: 'pulse',
    asset: 'onboardingProgress',
    decorative: true,
  },
  'coach-highlight': {
    seed: 'coach-highlight',
    glyph: 'rings',
    asset: 'onboardingCoach',
    decorative: true,
  },
  'empty-plan': {
    seed: 'empty-plan',
    glyph: 'dumbbell',
    asset: 'onboardingTrain',
    decorative: true,
  },
  // Sem foto: a tela de metas é um painel de números, e uma fotografia de
  // comida ali sugeriria um diário alimentar que o produto não tem.
  'nutrition-targets': {
    seed: 'nutrition-targets',
    glyph: 'flame',
    asset: null,
    decorative: true,
  },
};

/** Arte de um contexto. Total por construção — não existe contexto sem resposta. */
export function artworkFor(context: ArtworkContext): ArtworkSpec {
  return REGISTRY[context];
}

/**
 * Contextos que usam um determinado arquivo. Existe para o teste responder
 * "esta imagem é reaproveitada demais?" sem varrer as telas — é o guarda-corpo
 * da estratégia descrita no topo.
 */
export function contextsUsing(asset: ArtworkAssetKey): ArtworkContext[] {
  return artworkContexts.filter((context) => REGISTRY[context].asset === asset);
}
