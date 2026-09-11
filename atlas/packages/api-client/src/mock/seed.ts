import type {
  ClientOverview,
  ExerciseDetail,
  ExerciseId,
  MeasurementEntry,
  MeasurementId,
  MuscleGroup,
  MuscleRole,
  PerformedSet,
  ProfessionalSummary,
  SessionId,
  TrainingSession,
  UserId,
  UserProfile,
  WorkoutDayId,
  WorkoutPlan,
  WorkoutPlanId,
} from '@atlas/contracts';
import { leanMass } from '@atlas/domain';
import muscleGroupsFixture from './fixtures/muscle-groups.json' with { type: 'json' };
import exercisesFixture from './fixtures/exercises.json' with { type: 'json' };
import { uuidV4From } from './runtime.js';

/**
 * Geração determinística do dataset de demonstração.
 *
 * 14 semanas de histórico não é arbitrário: é o mínimo para os gráficos de
 * tendência, o heatmap e a detecção de estagnação terem o que mostrar.
 * Histórico curto faz o produto parecer vazio na tela que justifica a
 * assinatura. Ver spec 12 §4.
 */

const HISTORY_WEEKS = 14;
const CDN = 'https://cdn.atlas.example/exercises';

interface RawExercise {
  slug: string;
  name: string;
  equipment: string;
  difficulty: string;
  primary: string;
  activations: [string, string, number][];
  cues: string[];
  mistakes: string[];
}

export interface SeedData {
  me: UserProfile;
  muscleGroups: MuscleGroup[];
  exercises: ExerciseDetail[];
  plans: WorkoutPlan[];
  sessions: TrainingSession[];
  measurements: MeasurementEntry[];
  professionals: ProfessionalSummary[];
  clientOverviews: ClientOverview[];
}

export function buildSeedData(random: () => number): SeedData {
  const muscleGroups = muscleGroupsFixture as MuscleGroup[];
  const muscleIdByCode = new Map(muscleGroups.map((m) => [m.code, m.id]));

  const exercises: ExerciseDetail[] = (exercisesFixture as RawExercise[]).map((raw) => ({
    id: uuidV4From(random) as ExerciseId,
    name: raw.name,
    primaryMuscleCode: raw.primary,
    equipment: raw.equipment as ExerciseDetail['equipment'],
    difficulty: raw.difficulty as ExerciseDetail['difficulty'],
    thumbnailUrl: `${CDN}/${raw.slug}/thumb.webp`,
    isCustom: false,
    description: `Execução padrão de ${raw.name.toLowerCase()}.`,
    media: [
      { kind: 'loop', url: `${CDN}/${raw.slug}/front.mp4`, angle: 'front', durationMs: 8000 },
      { kind: 'loop', url: `${CDN}/${raw.slug}/side.mp4`, angle: 'side', durationMs: 8000 },
    ],
    activations: raw.activations.map(([code, role, weight]) => ({
      muscleGroupId: muscleIdByCode.get(code) ?? 0,
      muscleCode: code,
      role: role as MuscleRole,
      activationWeight: weight,
    })),
    executionCues: raw.cues,
    commonMistakes: raw.mistakes,
  }));

  const byName = (name: string): ExerciseDetail => {
    const found = exercises.find((e) => e.name === name);
    if (!found) throw new Error(`Fixture inconsistente: exercício "${name}" ausente`);
    return found;
  };

  const athleteId = uuidV4From(random) as UserId;

  const plans: WorkoutPlan[] = [
    buildPlan(random, athleteId, 'Push Pull Legs — Hipertrofia', 'hypertrophy', true, [
      {
        label: 'Push',
        slot: 1,
        exercises: [
          [byName('Supino reto com barra'), 4, 8, 72.5],
          [byName('Supino inclinado com halteres'), 3, 10, 26],
          [byName('Desenvolvimento com halteres'), 3, 10, 20],
          [byName('Elevação lateral'), 4, 14, 10],
          [byName('Tríceps na corda'), 3, 12, 28],
        ],
      },
      {
        label: 'Pull',
        slot: 3,
        exercises: [
          [byName('Barra fixa pronada'), 4, 7, 0],
          [byName('Remada curvada com barra'), 4, 9, 60],
          [byName('Puxada frontal na polia'), 3, 11, 55],
          [byName('Crucifixo inverso'), 3, 14, 9],
          [byName('Rosca direta com barra'), 3, 10, 30],
        ],
      },
      {
        label: 'Legs',
        slot: 5,
        exercises: [
          [byName('Agachamento livre'), 4, 7, 90],
          [byName('Stiff com halteres'), 3, 10, 28],
          [byName('Leg press 45°'), 3, 12, 180],
          [byName('Mesa flexora'), 3, 12, 45],
          [byName('Panturrilha em pé'), 4, 15, 70],
        ],
      },
    ]),
    buildPlan(random, athleteId, 'Full Body — Força 3x', 'strength', false, [
      {
        label: 'A',
        slot: 1,
        exercises: [
          [byName('Agachamento livre'), 5, 5, 100],
          [byName('Supino reto com barra'), 5, 5, 80],
          [byName('Remada curvada com barra'), 4, 6, 65],
        ],
      },
    ]),
    buildPlan(random, athleteId, 'Reabilitação de ombro — Fase 2', 'rehabilitation', false, [
      {
        label: 'Protocolo',
        slot: 2,
        exercises: [
          [byName('Rotação externa com banda'), 3, 15, 0],
          [byName('Crucifixo inverso'), 3, 15, 5],
          [byName('Prancha isométrica'), 3, 0, 0],
        ],
      },
    ]),
  ];

  const activePlan = plans[0]!;
  const sessions = buildSessions(random, activePlan);
  const measurements = buildMeasurements(random);
  for (const plan of plans.slice(2)) {
    plan.status = 'archived';
    plan.isActive = false;
  }
  const professionals = buildProfessionals(random);
  const clientOverviews = buildClientOverviews(random);

  const me: UserProfile = {
    id: athleteId,
    displayName: 'Marcus',
    email: 'demo@atlas.app',
    avatar: {
      photoUri: null,
      // Modelo gratuito masculino, ids do catálogo em
      // apps/mobile/src/features/avatar/avatar-presets.ts. O usuário demo
      // começa com um avatar que o plano Free realmente permite.
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
    roles: ['athlete'],
    // ATL-NUT-001 — entradas da estimativa metabólica.
    biologicalSex: 'male',
    activityLevel: 'moderate',
    goal: {
      type: 'hypertrophy',
      targetDate: iso(addDays(new Date(), 90)),
      targetWeightKg: 82,
      targetBodyFatPct: 14,
      weeklySessionTarget: 4,
    },
    heightCm: 178,
    birthDate: '1994-05-12',
    planKey: 'free',
    entitlements: [
      {
        feature: 'activeWorkoutPlans',
        limit: 2,
        used: plans.filter((p) => p.status !== 'archived').length,
      },
      { feature: 'customExercises', limit: 5, used: 0 },
      { feature: 'fullHistory', limit: 0, used: 0 },
      { feature: 'advancedInsights', limit: 0, used: 0 },
      { feature: 'bodyCompositionTracking', limit: 0, used: 0 },
      { feature: 'progressPhotos', limit: 0, used: 0 },
      { feature: 'interactiveAnatomy', limit: 0, used: 0 },
      { feature: 'premiumAvatarItems', limit: 0, used: 0 },
    ],
    createdAt: iso(addDays(new Date(), -HISTORY_WEEKS * 7 - 10)),
  };

  return {
    me,
    muscleGroups,
    exercises,
    plans,
    sessions,
    measurements,
    professionals,
    clientOverviews,
  };
}

type DaySpec = {
  label: string;
  slot: number;
  exercises: [ExerciseDetail, number, number, number][];
};

function buildPlan(
  random: () => number,
  ownerId: UserId,
  name: string,
  goal: WorkoutPlan['goal'],
  isActive: boolean,
  days: DaySpec[],
): WorkoutPlan {
  return {
    id: uuidV4From(random) as WorkoutPlanId,
    ownerId,
    name,
    goal,
    status: 'published',
    origin: 'selfCreated',
    version: 1,
    dayCount: days.length,
    prescribedByName: null,
    isActive,
    days: days.map((day) => ({
      id: uuidV4From(random) as WorkoutDayId,
      label: day.label,
      slot: day.slot,
      estimatedMinutes: 55,
      exercises: day.exercises.map(([exercise, setCount, reps, weight], index) => ({
        order: index + 1,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        thumbnailUrl: exercise.thumbnailUrl,
        technique: 'straight' as const,
        supersetGroup: null,
        notes: null,
        sets: Array.from({ length: setCount }, (_, i) => ({
          order: i + 1,
          targetReps: reps > 0 ? reps : null,
          targetRepsMax: reps > 0 ? reps + 2 : null,
          targetDurationSeconds: reps === 0 ? 45 : null,
          targetWeightKg: weight > 0 ? weight : null,
          targetRir: 2,
          targetRpe: null,
          restSeconds: 120,
          isWarmup: false,
        })),
      })),
    })),
  };
}

/** Progressão realista: carga sobe ~1,2%/semana com ruído, e há uma semana de deload. */
function buildSessions(random: () => number, plan: WorkoutPlan): TrainingSession[] {
  const sessions: TrainingSession[] = [];
  const today = new Date();

  for (let week = HISTORY_WEEKS - 1; week >= 0; week--) {
    const isDeload = week === 4;
    for (const day of plan.days) {
      const date = addDays(today, -(week * 7 + (6 - (day.slot ?? 1))));
      if (date > today) continue;
      if (random() < 0.12) continue; // aderência imperfeita, de propósito

      const progressionFactor = (1 + 0.012 * (HISTORY_WEEKS - 1 - week)) * (isDeload ? 0.85 : 1);
      const sets: PerformedSet[] = [];

      for (const prescription of day.exercises) {
        prescription.sets.forEach((setSpec, index) => {
          const baseWeight = setSpec.targetWeightKg ?? 0;
          const weight =
            baseWeight > 0
              ? roundToPlate(baseWeight * progressionFactor * (1 + (random() - 0.5) * 0.03))
              : 0;
          const reps = setSpec.targetReps ?? 12;

          sets.push({
            clientGeneratedId: uuidV4From(random),
            exerciseId: prescription.exerciseId,
            order: index + 1,
            weightKg: weight > 0 ? weight : null,
            reps: setSpec.targetDurationSeconds === null ? reps - (index > 1 ? 1 : 0) : null,
            durationSeconds: setSpec.targetDurationSeconds,
            rpe: null,
            rir: index === prescription.sets.length - 1 ? 0 : 2,
            isWarmup: false,
            painLevel: null,
            performedAt: iso(date),
          });
        });
      }

      const volume = sets.reduce((acc, s) => acc + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
      sessions.push({
        id: uuidV4From(random) as SessionId,
        planId: plan.id,
        planVersion: plan.version,
        dayLabel: day.label,
        status: 'completed',
        startedAt: iso(date),
        completedAt: iso(new Date(date.getTime() + 55 * 60 * 1000)),
        sets,
        totalVolumeKg: Math.round(volume),
        durationSeconds: 55 * 60,
      });
    }
  }

  return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

/** Peso com tendência de recomposição + ruído diário — o ruído é o ponto:
 *  é ele que justifica a média móvel de 7 dias na UI. */
function buildMeasurements(random: () => number): MeasurementEntry[] {
  const entries: MeasurementEntry[] = [];
  const today = new Date();
  let weight = 84.6;
  let bodyFat = 19.4;

  for (let day = HISTORY_WEEKS * 7; day >= 0; day -= 2) {
    weight += -0.035 + (random() - 0.5) * 0.7;
    bodyFat += -0.028 + (random() - 0.5) * 0.22;
    const date = addDays(today, -day);
    const w = round1(weight);
    const bf = round1(bodyFat);

    entries.push({
      id: uuidV4From(random) as MeasurementId,
      takenAt: iso(date),
      source: 'manual',
      weightKg: w,
      bodyFatPct: bf,
      leanMassKg: leanMass(w, bf),
      circumferences:
        day % 14 === 0
          ? {
              chestCm: round1(103 + random()),
              waistCm: round1(86 - (HISTORY_WEEKS * 7 - day) * 0.012),
              hipCm: round1(100 + random()),
              rightArmCm: round1(37 + random() * 0.6),
              leftArmCm: round1(36.7 + random() * 0.6),
              rightThighCm: round1(59 + random()),
              leftThighCm: round1(58.8 + random()),
            }
          : null,
      notes: null,
      hasPhotos: false,
    });
  }

  return entries.sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
}

function buildProfessionals(random: () => number): ProfessionalSummary[] {
  const seedList: [
    string,
    string,
    ProfessionalSummary['specialties'],
    ProfessionalSummary['modality'],
    number,
  ][] = [
    ['Renata Alves', 'CREF 012345-G/SP', ['hypertrophy', 'weightLoss'], 'hybrid', 289],
    ['Diego Monteiro', 'CREF 023981-G/SP', ['strength', 'sportsPerformance'], 'inPerson', 420],
    ['Camila Prado', 'CREFITO 98213-F', ['physiotherapy', 'postural'], 'hybrid', 350],
    ['Bruno Tanaka', 'CREF 044120-G/SP', ['hypertrophy'], 'online', 189],
    ['Larissa Nunes', 'CREFITO 77310-F', ['physiotherapy', 'elderly'], 'inPerson', 310],
    ['Felipe Braga', 'CREF 051772-G/SP', ['weightLoss', 'hypertrophy'], 'online', 149],
  ];

  return seedList.map(([displayName, credentialLabel, specialties, modality, price]) => ({
    id: uuidV4From(random) as UserId,
    displayName,
    avatarUrl: null,
    headline: 'Acompanhamento individualizado com ajuste semanal de carga.',
    credentialLabel,
    specialties,
    modality,
    city: 'Marília, SP',
    distanceKm: round1(random() * 18),
    monthlyPriceBrl: price,
    rating: round1(4.1 + random() * 0.85),
    reviewCount: Math.floor(8 + random() * 140),
    responseRate: round2(0.7 + random() * 0.29),
    acceptingClients: random() > 0.15,
  }));
}

/**
 * 24 alunos, com 3 em risco alto. A tela vazia de coach não vende nada —
 * o dataset de demo é curado, não aleatório. Ver spec 12 §3.
 */
function buildClientOverviews(random: () => number): ClientOverview[] {
  const names = [
    'Ana Beatriz',
    'Carlos Eduardo',
    'Priscila Moura',
    'Rafael Lima',
    'Juliana Castro',
    'Thiago Barros',
    'Marina Rocha',
    'Gustavo Freitas',
    'Letícia Amaral',
    'Vinícius Sá',
    'Patrícia Nogueira',
    'Eduardo Pires',
    'Fernanda Duarte',
    'Rodrigo Melo',
    'Bianca Teixeira',
    'André Vasques',
    'Isabela Correia',
    'Marcelo Fontes',
    'Natália Ribeiro',
    'Henrique Lopes',
    'Sofia Andrade',
    'Leonardo Cruz',
    'Tatiane Vieira',
    'Otávio Bastos',
  ];
  const goals: ClientOverview['goal'][] = ['hypertrophy', 'fatLoss', 'strength', 'rehabilitation'];

  return names.map((displayName, index) => {
    const atRisk = index < 3;
    const adherence7d = atRisk ? round2(random() * 0.3) : round2(0.55 + random() * 0.45);
    const daysSinceSession = atRisk ? 6 + Math.floor(random() * 12) : Math.floor(random() * 3);

    return {
      athleteId: uuidV4From(random) as UserId,
      displayName,
      avatarUrl: null,
      goal: goals[index % goals.length]!,
      adherence7d,
      adherence30d: round2(Math.min(1, adherence7d + random() * 0.25)),
      lastSessionAt: iso(addDays(new Date(), -daysSinceSession)),
      weightDelta30dKg: round1((random() - 0.5) * 3),
      leanMassDelta30dKg: round1((random() - 0.35) * 1.4),
      goalsAtRisk: atRisk ? 1 + Math.floor(random() * 2) : 0,
      unreadMessages: Math.floor(random() * 4),
      riskScore: atRisk ? round2(0.72 + random() * 0.27) : round2(random() * 0.5),
    };
  });
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
function iso(date: Date): string {
  return date.toISOString();
}
/** Carga real de academia sobe de 2,5 em 2,5 kg — número quebrado quebra a ilusão. */
function roundToPlate(value: number): number {
  return Math.round(value / 2.5) * 2.5;
}
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
