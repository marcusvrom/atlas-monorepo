/**
 * Tokens de design — fonte única de verdade visual.
 *
 * Nenhum hex, spacing ou radius literal pode aparecer em componente.
 * Ver AGENTS.md R5.
 */

export const palette = {
  // Tinta primária
  brand50: '#F4EFFF',
  brand200: '#D8C7FF',
  brand400: '#BBA0FF',
  brand500: '#A78BFA',
  brand600: '#7140D9',
  brand700: '#562AB0',

  // Semânticas
  success: '#3ECF8E',
  warning: '#FFB020',
  danger: '#FF5C5C',
  info: '#4CC9F0',

  // Neutros — escala pensada para tema escuro como padrão
  ink0: '#0B0912',
  ink50: '#100D1B',
  ink100: '#191525',
  ink200: '#231D33',
  ink300: '#342B49',
  ink400: '#51445F',
  ink500: '#70617F',
  ink600: '#A094B2',
  ink700: '#C8BDD8',
  ink800: '#E5DEF0',
  ink900: '#F9F6FF',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/**
 * Raios generosos não são estética arbitrária: o material do iOS 26 usa
 * curvatura contínua com raios grandes. Raio pequeno com vidro parece bug.
 */
export const radius = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  xxl: 36,
  pill: 999,
} as const;

export const typography = {
  family: {
    // null = fonte do sistema (SF Pro no iOS, Roboto Flex no Android)
    display: null,
    text: null,
    mono: 'SpaceMono',
  },
  size: {
    display: 34,
    title1: 28,
    title2: 22,
    title3: 20,
    body: 17,
    callout: 16,
    subhead: 15,
    footnote: 13,
    caption: 11,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    display: 41,
    title1: 34,
    title2: 28,
    title3: 25,
    body: 22,
    callout: 21,
    subhead: 20,
    footnote: 18,
    caption: 13,
  },
} as const;

/**
 * Gradientes de expressão da marca. Usados em superfícies de destaque (heros,
 * anéis de atividade, barras) — o que dá a vibração das telas de referência
 * sem quebrar o material de vidro. São a única fonte autorizada de gradiente:
 * componente nenhum inventa par de cor (R5). Cada entrada é um par
 * [início, fim] pensado para tema escuro, com contraste suficiente para texto
 * `textOnBrand` por cima. `angle` é a direção padrão sugerida (graus).
 */
export const gradients = {
  brand: { colors: ['#A78BFA', '#7140D9'], angle: 135 },
  /** Menta → azul: energia/atividade concluída. */
  mint: { colors: ['#3ECF8E', '#4CC9F0'], angle: 135 },
  /** Violeta → azul: foco/força. */
  violet: { colors: ['#C5A6FF', '#A78BFA'], angle: 135 },
  /** Quente: alerta amigável / calorias. */
  warm: { colors: ['#FFB020', '#FF7A59'], angle: 135 },
  /** Superfície escura translúcida para heros sobre a aurora. */
  slate: { colors: ['#231D33', '#191525'], angle: 160 },
} as const;

export type GradientName = keyof typeof gradients;

/**
 * Tons semânticos para anéis/tiles de progresso, mapeando um conceito a um
 * gradiente. Mantém consistência entre telas (aderência sempre menta, etc.).
 */
export const progressAccent = {
  primary: 'brand',
  activity: 'mint',
  strength: 'violet',
  energy: 'warm',
} as const;

export type ProgressAccent = keyof typeof progressAccent;

/** Parâmetros do material de vidro e do seu fallback. Ver spec 11. */
export const glass = {
  variant: {
    regular: { blurIntensity: 24, fallbackOpacity: 0.94, borderOpacity: 0.18 },
    clear: { blurIntensity: 12, fallbackOpacity: 0.94, borderOpacity: 0.26 },
  },
  borderWidth: 0.5,
  noiseOpacity: 0.035,
  shadow: { opacity: 0.18, radius: 24, offsetY: 8 },
} as const;

export const elevation = {
  none: { shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  sm: { shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  md: { shadowOpacity: 0.18, shadowRadius: 16, elevation: 5 },
  lg: { shadowOpacity: 0.24, shadowRadius: 28, elevation: 10 },
} as const;

/** Durações alinhadas ao sistema. Toda animação roda na UI thread. */
export const motion = {
  duration: { instant: 90, fast: 160, base: 240, slow: 360, morph: 480 },
  spring: {
    snappy: { damping: 24, stiffness: 260, mass: 1 },
    gentle: { damping: 20, stiffness: 140, mass: 1 },
    /** Entrada de conteúdo: suave, sem overshoot perceptível. */
    soft: { damping: 26, stiffness: 120, mass: 1 },
  },
  /**
   * Movimento ambiente do fundo. Lento de propósito: o gradiente respira, não
   * chama atenção. Fora da escala de `duration` porque não é resposta a toque —
   * é atmosfera. Desligado quando "Reduzir movimento" está ativo.
   */
  ambient: { drift: 16000, driftSlow: 26000 },
  /**
   * Escala do toque. Um único valor para botão, card de capa e linha tocável:
   * é a diferença entre "o app responde" e "cada componente responde de um
   * jeito". Recuo discreto de propósito — 3 % é sentido, 10 % é notado.
   */
  pressScale: 0.97,
} as const;

export const zIndex = {
  base: 0,
  content: 1,
  floatingControl: 50,
  header: 60,
  sheet: 80,
  modal: 100,
  toast: 120,
} as const;

/** Mapa de cor do heatmap anatômico. Luminância varia junto com a matiz
 *  para permanecer legível em daltonismo. Ver spec 11 §4. */
export const heatmapScale = [
  { stop: 0.0, color: '#231D33' },
  { stop: 0.25, color: '#562AB0' },
  { stop: 0.5, color: '#A78BFA' },
  { stop: 0.75, color: '#FFB020' },
  { stop: 1.0, color: '#FF5C5C' },
] as const;

/** ATL-AVT-001: tons da coleção vetorial inicial. */
export const avatarSkinTones = [
  '#F4D3B5',
  '#E8B894',
  '#CB926C',
  '#A56D4D',
  '#754931',
  '#442B22',
] as const;

/** ATL-UI-001 / PR 12: composição responsiva e ilustração funcional. */
export const layout = {
  pageInset: 24,
  sectionGap: 28,
  contentMaxWidth: 640,
  compactWidth: 360,
  iconSize: 22,
  iconStroke: 1.7,
  thumbnail: 64,
  anatomyWidth: 176,
  heroArt: 104,

  /**
   * ATL-UI-013 — alturas de capa. Escala fixa em vez de proporção livre: três
   * alturas fazem telas diferentes rimarem entre si, enquanto `aspectRatio`
   * por tela produziria um card levemente diferente em cada lugar.
   */
  coverHero: 212,
  coverCard: 164,
  coverRow: 84,
  /** Largura do card dentro de um `<Carousel>`. */
  carouselItem: 232,
  /** Retrato do usuário na etapa de foto e no perfil. */
  profilePhoto: 128,

  /**
   * ATL-SES-005 — alvo de toque de um controle redondo. 44 é o mínimo das HIG
   * da Apple e do Material; o stepper vive numa tela usada com a mão suada e
   * o braço estendido, então não é lugar de economizar área.
   */
  controlSize: 44,
  /**
   * Largura reservada ao valor do stepper. Fixa de propósito: com largura
   * automática os botões dançam horizontalmente quando o número passa de 9
   * para 10, e o polegar erra o alvo que estava mirando.
   */
  stepperValue: 88,
} as const;
export const opacity = { pressed: 0.72, decorative: 0.16, subtle: 0.06 } as const;

/**
 * ATL-UI-013 — paletas de capa.
 *
 * O produto não tem banco de fotos próprio e os `thumbnailUrl` do catálogo
 * apontam para um CDN que só existirá na fase de integração. Em vez de deixar
 * buracos cinza nas telas (ou depender de rede numa demo), o app **gera** a
 * arte de capa: cada capa é um gradiente de malha determinístico derivado de
 * uma semente estável (id do exercício, do plano, código do músculo).
 *
 * Os tons vêm das pranchas de marca em `ui-examples/` (rampas "Pomp Power" e
 * "Purple", mais os nomeados Twilight Gaze / Midnight Whisper / Violet Spell /
 * Enchanted Amethyst), então a arte gerada pertence à mesma família visual das
 * referências em vez de inventar cor. Cada entrada é `[base, meio, luz]`:
 * `base` pinta o fundo, `meio` a banda diagonal e `luz` os focos radiais.
 *
 * Seis paletas é proposital: o suficiente para uma lista rolada não repetir
 * visivelmente, pouco o bastante para o conjunto ainda ler como um sistema.
 */
export const coverPalettes = [
  { name: 'twilight', colors: ['#1D0F30', '#4A306D', '#A167A5'] },
  { name: 'amethyst', colors: ['#29264C', '#5B4A93', '#8F7AB8'] },
  { name: 'spell', colors: ['#2A1140', '#6E3482', '#A56ABD'] },
  { name: 'gaze', colors: ['#180A22', '#501F5B', '#B89AC9'] },
  { name: 'tide', colors: ['#0F1B33', '#2F4C86', '#5BA8C9'] },
  { name: 'ember', colors: ['#2B1330', '#7A2F6A', '#C97BA0'] },
] as const;

export type CoverPaletteName = (typeof coverPalettes)[number]['name'];

/**
 * Geometria e opacidades da arte de capa. Ficam em token (R5) porque a mesma
 * composição é usada por `CoverArt` em tamanhos diferentes — do thumbnail de
 * 64 px ao hero de tela cheia — e precisa escalar por proporção, não por
 * número mágico repetido em cada tela.
 */
export const cover = {
  /** Lado do viewBox quadrado em que a arte é desenhada. */
  canvas: 100,
  /**
   * Focos radiais. Raio e opacidade são contidos de propósito: um foco largo
   * e forte lava a cor da base e a capa vira uma mancha acinzentada — o tom
   * da paleta precisa continuar sendo o que identifica o card.
   */
  glowRadius: 0.46,
  glowOpacity: 0.72,
  /** Banda diagonal que dá estrutura à composição. */
  bandOpacity: 0.17,
  bandWidth: 0.42,
  /**
   * Glifo. Ancorado no quadrante superior direito, **não** no centro: é o lado
   * oposto ao texto do rodapé, o mesmo lugar onde as referências põem a foto do
   * equipamento. Centralizado, ele sumia sob o véu de contraste.
   */
  glyphOpacity: 0.26,
  glyphScale: 0.46,
  glyphAnchor: { x: 0.7, y: 0.31 },
  /**
   * Véu escuro sob o texto sobreposto — garante contraste AA no rodapé mesmo
   * quando o foco de luz cai no canto inferior. Vem em `rgba` já pronto porque
   * o degradê precisa terminar transparente **na mesma matiz** (um preto puro
   * esverdearia a borda contra o violeta); `scrimStart` é onde ele começa a
   * escurecer, em fração da altura.
   */
  /**
   * Superfícies sobrepostas à capa (chips de metadado, botão de reprodução).
   *
   * **Não** vêm do tema, de propósito: a arte de capa é escura nos dois temas,
   * então a superfície de vidro do tema claro (branca a 82 %) sumiria sobre ela
   * e levaria junto o texto claro por cima. Contraste sobre a capa é problema
   * da capa, não do tema.
   */
  onCoverSurface: 'rgba(11,9,18,0.55)',
  onCoverBorder: 'rgba(249,246,255,0.30)',

  /**
   * A parada do meio subiu de 0,18 para 0,30 nesta rodada. Medindo o pixel mais
   * claro que a arte consegue produzir (tom claro da paleta sob o foco radial e
   * a banda), o texto `onAccent` ficava em 4,37:1 sobre ele — abaixo de AA, e
   * justamente na faixa onde a tampa do card cai quando o título ocupa duas
   * linhas. Com 0,30 o pior caso vai a 5,5:1. O topo continua intocado, então a
   * capa não escureceu como imagem; o que mudou é o meio, que é onde texto
   * começa a existir. Ver `contrast.test.ts`.
   */
  scrim: ['rgba(11,9,18,0)', 'rgba(11,9,18,0.30)', 'rgba(11,9,18,0.94)'],
  /**
   * Posições das três paradas. A última é quase opaca **na cor do fundo do
   * tema escuro**: é isso que faz a capa se dissolver na página em vez de
   * terminar numa linha reta, e é o que sustenta AA para o texto do rodapé.
   */
  scrimStops: [0, 0.45, 1],
} as const;

/**
 * Parâmetros dos gráficos. A área sob a linha ganha preenchimento em gradiente
 * (referência "Travel Stats" / "Weight Dynamics" em `ui-examples/`), que só
 * funciona se as opacidades forem consistentes entre sparkline, gráfico de
 * métrica e barras.
 */
export const chart = {
  areaOpacityTop: 0.34,
  areaOpacityBottom: 0.02,
  lineWidth: 2.5,
  dotRadius: 3.5,
  gridOpacity: 0.12,
  /** Barra não selecionada de um gráfico de atividade. */
  barIdleOpacity: 0.42,
} as const;
