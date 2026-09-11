/**
 * ATL-AVT-003 — modelos de avatar.
 *
 * Mudança de modelo de monetização. Antes o paywall era **por peça**: as duas
 * últimas opções de cada categoria eram premium e todo o resto era livre, o que
 * dava ao usuário gratuito um construtor quase completo e um punhado de itens
 * bloqueados espalhados — nem generoso nem vendável.
 *
 * Agora: **dois avatares prontos são gratuitos, um feminino e um masculino.**
 * Montar o seu, peça por peça, é Pro.
 *
 * Uma exceção, deliberada: **tom de pele nunca é pago**, nem aqui nem no
 * construtor. Cobrar para alguém se parecer consigo mesmo é outra coisa que não
 * monetização, e a regra tem teste próprio.
 *
 * Sem React nem dependência nativa — o gerador de folha de contato
 * (`scripts/preview-avatar.mjs`) importa este arquivo direto.
 */

export type AvatarGender = 'feminine' | 'masculine';

export interface AvatarPresetConfig {
  readonly base: string;
  readonly skinTone: string;
  readonly hair: string;
  readonly face: string;
  readonly outfit: string;
  readonly accessory: string | null;
  readonly frame: string | null;
  readonly background: string;
  readonly hairColor: string | null;
  readonly outfitColor: string | null;
  readonly backgroundColor: string | null;
}

export interface AvatarPreset {
  readonly id: string;
  readonly gender: AvatarGender;
  /** `null` = gratuito. Exatamente dois modelos têm `null`. */
  readonly requiredFeature: 'premiumAvatarItems' | null;
  readonly config: AvatarPresetConfig;
}

/** Campos que um modelo fixa. Tom de pele fica de fora: é sempre do usuário. */
export const PRESET_FIELDS = [
  'base',
  'hair',
  'face',
  'outfit',
  'accessory',
  'frame',
  'background',
  'hairColor',
  'outfitColor',
  'backgroundColor',
] as const;

export const avatarPresets: readonly AvatarPreset[] = [
  // ── Gratuitos ─────────────────────────────────────────────────────────────
  {
    id: 'free-feminine',
    gender: 'feminine',
    requiredFeature: null,
    config: {
      base: 'base-0',
      skinTone: 'skinTone-2',
      hair: 'hair-3',
      face: 'face-5',
      outfit: 'outfit-1',
      accessory: null,
      frame: null,
      background: 'background-0',
      hairColor: '#5A3A22',
      outfitColor: '#A78BFA',
      backgroundColor: '#4A306D',
    },
  },
  {
    id: 'free-masculine',
    gender: 'masculine',
    requiredFeature: null,
    config: {
      base: 'base-2',
      skinTone: 'skinTone-2',
      hair: 'hair-0',
      face: 'face-3',
      outfit: 'outfit-0',
      accessory: null,
      frame: null,
      background: 'background-0',
      hairColor: '#2B2119',
      outfitColor: '#4CC9F0',
      backgroundColor: '#2F4C86',
    },
  },

  // ── Pro ───────────────────────────────────────────────────────────────────
  {
    id: 'pro-feminine-curls',
    gender: 'feminine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-0',
      skinTone: 'skinTone-4',
      hair: 'hair-4',
      face: 'face-2',
      outfit: 'outfit-2',
      accessory: 'accessory-2',
      frame: 'frame-0',
      background: 'background-1',
      hairColor: '#2B2119',
      outfitColor: '#3ECF8E',
      backgroundColor: '#7A2F6A',
    },
  },
  {
    id: 'pro-feminine-bun',
    gender: 'feminine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-3',
      skinTone: 'skinTone-1',
      hair: 'hair-5',
      face: 'face-0',
      outfit: 'outfit-1',
      accessory: 'accessory-4',
      frame: 'frame-1',
      background: 'background-2',
      hairColor: '#C79A4B',
      outfitColor: '#FF5C5C',
      backgroundColor: '#501F5B',
    },
  },
  {
    id: 'pro-feminine-ponytail',
    gender: 'feminine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-2',
      skinTone: 'skinTone-3',
      hair: 'hair-6',
      face: 'face-3',
      outfit: 'outfit-3',
      accessory: 'accessory-0',
      frame: null,
      background: 'background-3',
      hairColor: '#2B2119',
      outfitColor: '#562AB0',
      backgroundColor: '#29264C',
    },
  },
  {
    id: 'pro-masculine-beard',
    gender: 'masculine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-1',
      skinTone: 'skinTone-1',
      hair: 'hair-1',
      face: 'face-1',
      outfit: 'outfit-2',
      accessory: 'accessory-1',
      frame: 'frame-0',
      background: 'background-4',
      hairColor: '#2B2119',
      outfitColor: '#51445F',
      backgroundColor: '#1D0F30',
    },
  },
  {
    id: 'pro-masculine-cap',
    gender: 'masculine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-2',
      skinTone: 'skinTone-5',
      hair: 'hair-1',
      face: 'face-4',
      outfit: 'outfit-0',
      accessory: 'accessory-3',
      frame: null,
      background: 'background-5',
      hairColor: '#2B2119',
      outfitColor: '#FFB020',
      backgroundColor: '#2A1140',
    },
  },
  {
    id: 'pro-masculine-afro',
    gender: 'masculine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-1',
      skinTone: 'skinTone-4',
      hair: 'hair-7',
      face: 'face-2',
      outfit: 'outfit-3',
      accessory: null,
      frame: 'frame-2',
      background: 'background-1',
      hairColor: '#2B2119',
      outfitColor: '#4CC9F0',
      backgroundColor: '#6E3482',
    },
  },
  {
    id: 'pro-neutral-waves',
    gender: 'feminine',
    requiredFeature: 'premiumAvatarItems',
    config: {
      base: 'base-0',
      skinTone: 'skinTone-0',
      hair: 'hair-2',
      face: 'face-0',
      outfit: 'outfit-0',
      accessory: 'accessory-0',
      frame: 'frame-3',
      background: 'background-2',
      hairColor: '#9B9B9B',
      outfitColor: '#A78BFA',
      backgroundColor: '#4A306D',
    },
  },
];

export const freePresets = avatarPresets.filter((preset) => preset.requiredFeature === null);

/**
 * O avatar é permitido sem assinatura?
 *
 * Verdadeiro quando o usuário tem direito, ou quando a configuração é
 * **exatamente** um dos modelos gratuitos — ignorando tom de pele e foto, que
 * nunca são pagos. É a regra que impede alguém de escolher o modelo grátis e
 * depois trocar uma peça por uma premium e salvar assim mesmo.
 */
export function isAvatarAllowed(config: Record<string, unknown>, entitled: boolean): boolean {
  if (entitled) return true;
  return freePresets.some((preset) =>
    PRESET_FIELDS.every((field) => config[field] === preset.config[field]),
  );
}
