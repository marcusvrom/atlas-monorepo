/**
 * ATL-AVT-003 — geometria das peças do avatar.
 *
 * Arquivo só de dados, sem React: é o que permite gerar uma folha de contato
 * das peças fora do app (ver `scripts/preview-avatar.mjs`) e iterar no desenho
 * olhando o resultado, em vez de escrever bezier às cegas.
 *
 * Sistema de coordenadas: viewBox 128×128.
 *
 *   fundo      círculo r=62 em (64,64)
 *   cabeça     x 40..88, y 18..78 — oval com maxilar afilado
 *   orelhas    (39,52) e (89,52)
 *   olhos      y≈52, cx 55 e 73
 *   boca       y≈64
 *   ombros     y 84..118
 *
 * Toda peça nova precisa respeitar essas âncoras, senão o cabelo flutua sobre a
 * testa e a gola corta o pescoço. É por isso que elas estão escritas aqui e não
 * espalhadas em comentários.
 */

/** Cabeça com maxilar afilado — a elipse anterior dava um rosto de boneco. */
export const HEAD_PATH =
  'M 64 18 C 80 18 88 30 88 46 C 88 63 78 78 64 78 C 50 78 40 63 40 46 C 40 30 48 18 64 18 Z';

/** Pescoço, e a sombra que o separa do queixo. Sem ela a cabeça parece colada. */
export const NECK_PATH = 'M 56 70 L 72 70 L 72 88 Q 64 94 56 88 Z';
export const NECK_SHADOW_PATH = 'M 56 70 L 72 70 L 71 76 Q 64 81 57 76 Z';

export const EAR = { rx: 4, ry: 6, y: 52, left: 40, right: 88 } as const;

export const EYE = { left: 55, right: 73, y: 52 } as const;

/** Ombros. Muda a constituição; o resto da silhueta vem da roupa por cima. */
export const basePaths = [
  // Média
  'M 34 118 C 34 96 46 86 64 86 C 82 86 94 96 94 118 Z',
  // Larga
  'M 26 118 C 26 94 44 84 64 84 C 84 84 102 94 102 118 Z',
  // Atlética (V)
  'M 32 118 C 30 92 46 85 64 85 C 82 85 98 92 96 118 Z',
  // Compacta
  'M 38 118 C 38 98 48 88 64 88 C 80 88 90 98 90 118 Z',
];

export interface HairStyle {
  /** Traços desenhados ATRÁS da cabeça (volume, mechas, rabo). */
  readonly behind: readonly string[];
  /** Traços desenhados NA FRENTE da cabeça (topo, franja). */
  readonly front: readonly string[];
}

/**
 * Cabelos. A divisão frente/trás é o que faz o cabelo longo existir: sem ela,
 * qualquer mecha que descesse pelos ombros ficaria por cima do rosto.
 */
export const hairStyles: HairStyle[] = [
  // 0 — Curto com risca lateral
  {
    behind: [],
    front: [
      'M 39 52 C 39 26 49 15 64 15 C 79 15 89 26 89 52 L 85 40 C 80 30 72 27 63 29 C 55 31 48 37 43 47 Z',
      'M 56 30 C 62 36 70 38 80 37 L 82 32 C 72 32 64 29 58 25 Z',
    ],
  },
  // 1 — Raspado (rente ao crânio)
  {
    behind: [],
    front: [
      'M 41 44 C 42 27 51 18 64 18 C 77 18 86 27 87 44 C 84 33 76 27 64 27 C 52 27 44 33 41 44 Z',
    ],
  },
  // 2 — Ondulado médio
  {
    behind: [
      'M 38 44 C 34 66 38 78 42 84 L 48 80 C 44 70 43 58 45 46 Z',
      'M 90 44 C 94 66 90 78 86 84 L 80 80 C 84 70 85 58 83 46 Z',
    ],
    front: [
      'M 38 56 C 36 30 48 14 64 14 C 80 14 92 30 90 56 L 85 44 C 82 51 76 47 74 41 C 69 48 61 48 56 43 C 52 50 45 51 43 44 Z',
    ],
  },
  // 3 — Longo liso
  {
    behind: [
      'M 38 46 C 36 64 36 82 39 96 L 50 96 C 46 80 46 62 47 48 Z',
      'M 90 46 C 92 64 92 82 89 96 L 78 96 C 82 80 82 62 81 48 Z',
    ],
    front: [
      'M 40 22 C 48 13 80 13 88 22 C 92 29 92 40 90 50 L 84 42 C 80 33 73 29 64 29 C 55 29 48 33 44 42 L 38 50 C 36 40 36 29 40 22 Z',
    ],
  },
  // 4 — Cacheado volumoso
  {
    behind: [
      'M 34 48 C 28 70 32 88 38 98 L 50 94 C 44 82 42 64 44 50 Z',
      'M 94 48 C 100 70 96 88 90 98 L 78 94 C 84 82 86 64 84 50 Z',
    ],
    front: [
      'M 34 52 C 30 24 45 11 64 11 C 83 11 98 24 94 52 C 92 42 90 36 86 32 C 80 27 72 26 64 26 C 56 26 48 27 42 32 C 38 36 36 42 34 52 Z',
    ],
  },
  // 5 — Coque
  {
    behind: ['M 64 1 C 73 1 79 7 79 15 C 79 23 73 29 64 29 C 55 29 49 23 49 15 C 49 7 55 1 64 1 Z'],
    front: [
      'M 41 48 C 41 25 51 17 64 17 C 77 17 87 25 87 48 C 83 36 75 31 64 31 C 53 31 45 36 41 48 Z',
    ],
  },
  // 6 — Rabo de cavalo
  {
    behind: ['M 86 34 C 98 42 100 62 94 78 C 92 86 88 90 83 90 C 88 76 90 56 82 42 Z'],
    front: [
      'M 41 48 C 41 25 51 17 64 17 C 77 17 87 25 87 48 C 83 36 75 31 64 31 C 53 31 45 36 41 48 Z',
    ],
  },
  // 7 — Afro
  {
    behind: [],
    front: [
      'M 64 6 C 86 6 98 22 96 44 C 95 54 91 61 86 64 C 88 44 79 30 64 30 C 49 30 40 44 42 64 C 37 61 33 54 32 44 C 30 22 42 6 64 6 Z',
    ],
  },
];

export interface AvatarFace {
  /** Raio do olho. */
  readonly eyeRx: number;
  readonly eyeRy: number;
  /** Sobrancelha: traço espelhado no eixo vertical. */
  readonly brow: string;
  readonly mouth: string;
  /** Boca preenchida (sorriso aberto) em vez de só traço. */
  readonly mouthFilled: boolean;
}

/**
 * Rostos. Cada entrada descreve tudo o que o rosto muda. Antes os olhos saíam
 * de condicionais soltas no componente (`face === 1 ? 3 : 2`), o que tornava
 * impossível acrescentar um rosto sem editar o render.
 *
 * `brow` é desenhado à esquerda e espelhado à direita — sobrancelha assimétrica
 * lê como defeito de renderização, não como expressão.
 */
export const avatarFaces: AvatarFace[] = [
  // 0 — Neutro
  {
    eyeRx: 3,
    eyeRy: 3.4,
    brow: 'M 50 44 Q 55 41 60 44',
    mouth: 'M 57 64 Q 64 69 71 64',
    mouthFilled: false,
  },
  // 1 — Sério
  {
    eyeRx: 3,
    eyeRy: 2.6,
    brow: 'M 50 43 L 60 45',
    mouth: 'M 58 66 L 70 66',
    mouthFilled: false,
  },
  // 2 — Sorriso aberto
  {
    eyeRx: 3,
    eyeRy: 3.4,
    brow: 'M 50 43 Q 55 40 60 43',
    mouth: 'M 56 63 Q 64 74 72 63 Z',
    mouthFilled: true,
  },
  // 3 — Confiante
  {
    eyeRx: 3.2,
    eyeRy: 3,
    brow: 'M 50 42 Q 55 40 60 44',
    mouth: 'M 57 65 Q 62 68 71 63',
    mouthFilled: false,
  },
  // 4 — Focado (olhos estreitos)
  {
    eyeRx: 3.2,
    eyeRy: 1.6,
    brow: 'M 50 44 L 60 42',
    mouth: 'M 58 66 Q 64 63 70 66',
    mouthFilled: false,
  },
  // 5 — Alegre
  {
    eyeRx: 2.8,
    eyeRy: 3.6,
    brow: 'M 49 42 Q 55 39 61 43',
    mouth: 'M 56 62 Q 64 71 72 62',
    mouthFilled: false,
  },
];

export interface Outfit {
  readonly paths: readonly string[];
  /** Recorte do decote, na cor da pele — é o que dá gola à peça. */
  readonly neckline?: string;
  /** Camada sob a peça (camiseta por baixo da jaqueta), em tom mais escuro. */
  readonly inner?: string;
}

export const outfits: Outfit[] = [
  // 0 — Camiseta
  {
    paths: ['M 30 118 L 36 97 C 42 91 50 88 56 87 L 64 96 L 72 87 C 78 88 86 91 92 97 L 98 118 Z'],
    neckline: 'M 56 87 L 64 96 L 72 87 C 68 85 60 85 56 87 Z',
  },
  // 1 — Regata
  {
    paths: [
      'M 38 118 L 42 99 C 46 93 50 90 54 88 L 58 98 L 64 102 L 70 98 L 74 88 C 78 90 82 93 86 99 L 90 118 Z',
    ],
    neckline: 'M 54 88 L 58 98 L 64 102 L 70 98 L 74 88 C 68 85 60 85 54 88 Z',
  },
  // 2 — Moletom
  {
    paths: [
      'M 26 118 L 32 95 C 40 89 50 86 56 85 C 58 93 70 93 72 85 C 78 86 88 89 96 95 L 102 118 Z',
    ],
    neckline: 'M 56 85 C 58 93 70 93 72 85 C 68 83 60 83 56 85 Z',
  },
  // 3 — Jaqueta aberta. O painel central é a camiseta por baixo, em tom mais
  // escuro da própria cor — em tom de pele lia como torso nu.
  {
    paths: [
      'M 28 118 L 34 97 C 40 91 48 88 55 87 L 60 118 Z',
      'M 100 118 L 94 97 C 88 91 80 88 73 87 L 68 118 Z',
    ],
    inner: 'M 55 87 C 60 92 68 92 73 87 L 71 118 L 57 118 Z',
  },
];

export type AccessoryPaint = 'stroke' | 'hair' | 'outfit';

export interface Accessory {
  readonly paths: readonly string[];
  /**
   * Como a peça é pintada:
   *
   * - `stroke` — contorno (óculos, brincos), que é o que um arame de fato é.
   * - `hair`   — preenchido na cor do cabelo. Barba em preto fixo brigava com
   *   qualquer tom de cabelo que não fosse escuro.
   * - `outfit` — preenchido na cor da roupa. Boné e faixa desenhados só a
   *   contorno viravam arame flutuando sobre a cabeça.
   */
  readonly paint: AccessoryPaint;
}

export const accessories: Accessory[] = [
  // 0 — Óculos (armação arredondada; retângulo duro lia como visor)
  {
    paths: [
      'M 46 52 C 46 48 60 48 60 52 C 60 57 57 60 53 60 C 49 60 46 57 46 52 Z',
      'M 68 52 C 68 48 82 48 82 52 C 82 57 79 60 75 60 C 71 60 68 57 68 52 Z',
      'M 60 52 C 62 50 66 50 68 52',
      'M 46 51 L 40 52 M 82 51 L 88 52',
    ],
    paint: 'stroke',
  },
  // 1 — Barba
  {
    paths: [
      'M 43 50 C 43 70 51 80 64 80 C 77 80 85 70 85 50 C 85 64 79 72 64 72 C 49 72 43 64 43 50 Z',
    ],
    paint: 'hair',
  },
  // 2 — Brincos
  { paths: ['M 39 59 L 39 65 M 89 59 L 89 65'], paint: 'stroke' },
  // 3 — Boné
  {
    paths: [
      'M 39 41 C 39 23 50 14 64 14 C 78 14 89 23 89 41 Z',
      'M 39 41 C 30 41 24 44 22 48 C 30 47 34 46 39 46 Z',
    ],
    paint: 'outfit',
  },
  // 4 — Faixa de cabeça
  { paths: ['M 40 39 C 48 33 80 33 88 39 L 87 47 C 78 41 50 41 41 47 Z'], paint: 'outfit' },
];
