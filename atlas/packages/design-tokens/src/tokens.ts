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
} as const;
export const opacity = { pressed: 0.72, decorative: 0.16, subtle: 0.06 } as const;
