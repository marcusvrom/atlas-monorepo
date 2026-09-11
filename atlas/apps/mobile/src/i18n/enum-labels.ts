import type {
  ActivityLevel,
  BiologicalSex,
  BodyRegion,
  Difficulty,
  Equipment,
} from '@atlas/contracts';
import type { MessageKey } from './index';

/**
 * Rótulos de enum do contrato.
 *
 * Vivem num módulo próprio porque a mesma tradução é lida no onboarding, no
 * perfil, no catálogo e no montador de ficha — e porque `Record<Enum, MessageKey>`
 * transforma "esqueci de traduzir um valor novo" em erro de compilação, em vez
 * de uma chave crua aparecendo na tela. Acrescentar um membro ao enum quebra o
 * build aqui, que é exatamente onde deve quebrar.
 */

export const sexLabel: Record<BiologicalSex, MessageKey> = {
  male: 'sexMale',
  female: 'sexFemale',
  unspecified: 'sexUnspecified',
};

export const activityLabel: Record<ActivityLevel, MessageKey> = {
  sedentary: 'activitySedentary',
  light: 'activityLight',
  moderate: 'activityModerate',
  high: 'activityHigh',
  athlete: 'activityAthlete',
};

export const regionLabel: Record<BodyRegion, MessageKey> = {
  shoulder: 'regionShoulder',
  elbow: 'regionElbow',
  wrist: 'regionWrist',
  neck: 'regionNeck',
  lowerBack: 'regionLowerBack',
  hip: 'regionHip',
  knee: 'regionKnee',
  ankle: 'regionAnkle',
};

export const equipmentLabel: Record<Equipment, MessageKey> = {
  barbell: 'equipmentBarbell',
  dumbbell: 'equipmentDumbbell',
  machine: 'equipmentMachine',
  cable: 'equipmentCable',
  bodyweight: 'equipmentBodyweight',
  kettlebell: 'equipmentKettlebell',
  band: 'equipmentBand',
  ball: 'equipmentBall',
  none: 'equipmentNone',
};

export const levelLabel: Record<Difficulty, MessageKey> = {
  beginner: 'difficulty_beginner',
  intermediate: 'difficulty_intermediate',
  advanced: 'difficulty_advanced',
};

/**
 * O nível vem com uma frase de apoio porque "intermediário" não quer dizer nada
 * sozinho: sem a descrição, todo mundo se declara intermediário por default, e
 * o campo deixa de informar qualquer coisa.
 */
export const levelHint: Record<Difficulty, MessageKey> = {
  beginner: 'levelBeginnerHint',
  intermediate: 'levelIntermediateHint',
  advanced: 'levelAdvancedHint',
};
