/**
 * Correspondência entre o catálogo pt-BR do Atlas e o Free Exercise DB.
 *
 * O banco fornece duas fotos por movimento (posição inicial e final) e é
 * publicado em domínio público. Manter a correspondência explícita evita
 * heurísticas frágeis por nome e permite revisar cada demonstração.
 *
 * Fonte e licença: https://github.com/yuhonas/free-exercise-db
 */
export const exerciseMediaIds = {
  'supino-reto-barra': 'Barbell_Bench_Press_-_Medium_Grip',
  'supino-inclinado-halteres': 'Incline_Dumbbell_Press',
  'crucifixo-cabo': 'Cable_Crossover',
  'barra-fixa-pronada': 'Pullups',
  'remada-curvada-barra': 'Bent_Over_Barbell_Row',
  'puxada-frontal': 'Wide-Grip_Lat_Pulldown',
  'remada-unilateral-halter': 'One-Arm_Dumbbell_Row',
  'agachamento-livre': 'Barbell_Squat',
  'leg-press-45': 'Leg_Press',
  'cadeira-extensora': 'Leg_Extensions',
  'levantamento-terra': 'Barbell_Deadlift',
  'stiff-halteres': 'Stiff-Legged_Dumbbell_Deadlift',
  'mesa-flexora': 'Lying_Leg_Curls',
  'elevacao-pelvica': 'Barbell_Hip_Thrust',
  'desenvolvimento-halteres': 'Dumbbell_Shoulder_Press',
  'elevacao-lateral': 'Side_Lateral_Raise',
  'crucifixo-inverso': 'Reverse_Flyes',
  'rosca-direta': 'Barbell_Curl',
  'triceps-testa': 'EZ-Bar_Skullcrusher',
  'triceps-corda': 'Triceps_Pushdown_-_Rope_Attachment',
  'prancha-isometrica': 'Plank',
  'abdominal-cabo': 'Cable_Crunch',
  'panturrilha-em-pe': 'Standing_Calf_Raises',
  'rotacao-externa-banda': 'External_Rotation_with_Band',
  'ponte-glutea-unilateral': 'Single_Leg_Glute_Bridge',
  'abducao-quadril-banda': 'Thigh_Abductor',
  'supino-reto-com-halteres': 'Dumbbell_Bench_Press',
  'supino-reto-na-maquina': 'Machine_Bench_Press',
  'supino-inclinado-com-barra': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  'flexao-de-bracos': 'Pushups',
  'crucifixo-com-halteres': 'Dumbbell_Flyes',
  'crucifixo-na-maquina': 'Butterfly',
  'barra-fixa-supinada': 'Chin-Up',
  'puxada-com-pegada-neutra': 'V-Bar_Pulldown',
  'puxada-unilateral-na-polia': 'One_Arm_Lat_Pulldown',
  'remada-com-barra-t': 'T-Bar_Row_with_Handle',
  'remada-apoiada-com-halteres': 'Bent_Over_Two-Dumbbell_Row_With_Palms_In',
  'remada-sentada-na-polia': 'Seated_Cable_Rows',
  'remada-na-maquina': 'Leverage_Iso_Row',
  'agachamento-goblet': 'Goblet_Squat',
  'agachamento-frontal': 'Front_Squat_Clean_Grip',
  'agachamento-bulgaro': 'Split_Squat_with_Dumbbells',
  'passada-com-halteres': 'Dumbbell_Lunges',
  'subida-no-banco': 'Dumbbell_Step_Ups',
  'agachamento-hack': 'Hack_Squat',
  'levantamento-terra-romeno': 'Romanian_Deadlift',
  'stiff-unilateral': 'Kettlebell_One-Legged_Deadlift',
  'flexao-de-joelho-sentada': 'Seated_Leg_Curl',
  'elevacao-pelvica-na-maquina': 'Barbell_Hip_Thrust',
  'desenvolvimento-com-barra': 'Barbell_Shoulder_Press',
  'desenvolvimento-na-maquina': 'Machine_Shoulder_Military_Press',
  'elevacao-lateral-na-polia': 'Cable_Seated_Lateral_Raise',
  'crucifixo-inverso-na-maquina': 'Reverse_Machine_Flyes',
  'rosca-alternada': 'Dumbbell_Alternate_Bicep_Curl',
  'rosca-na-polia-baixa': 'Standing_Biceps_Cable_Curl',
  'rosca-martelo': 'Hammer_Curls',
  'extensao-de-triceps-com-halter': 'Standing_Dumbbell_Triceps_Extension',
  'extensao-de-triceps-com-barra-na-polia': 'Triceps_Pushdown_-_V-Bar_Attachment',
  'panturrilha-sentada': 'Seated_Calf_Raise',
  'prancha-lateral': 'Side_Bridge',
} as const;

const IMAGE_ROOT = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export function exerciseImageUrl(slug: keyof typeof exerciseMediaIds, frame: 0 | 1): string {
  return `${IMAGE_ROOT}/${exerciseMediaIds[slug]}/${frame}.jpg`;
}
