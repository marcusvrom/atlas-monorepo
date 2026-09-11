import type {
  CheckInEntry,
  ClientOverview,
  ExerciseDetail,
  MeasurementEntry,
  MuscleGroup,
  ProfessionalSummary,
  TrainingSession,
  UserProfile,
  WorkoutPlan,
} from '@atlas/contracts';
import { createRandom, type MockRuntimeConfig } from './runtime.js';
import { buildSeedData } from './seed.js';

/**
 * Estado MUTÁVEL em memória.
 *
 * Esta é a diferença entre um mock útil e um JSON estático: fluxos de escrita
 * são reais — criar ficha, registrar série, ver refletir no progresso.
 * Sem isso, a demo mente e a integração descobre requisitos. Ver spec 12 §2.
 */
export interface MockStore {
  checkIns: Map<string, CheckInEntry>;
  checkInWrites: Map<string, CheckInEntry>;
  config: MockRuntimeConfig;
  me: UserProfile;
  muscleGroups: MuscleGroup[];
  exercises: ExerciseDetail[];
  plans: WorkoutPlan[];
  sessions: TrainingSession[];
  measurements: MeasurementEntry[];
  professionals: ProfessionalSummary[];
  clientOverviews: ClientOverview[];
  /** ATL-NUT-001 — água consumida por dia local ("YYYY-MM-DD" → ml). */
  hydration: Map<string, number>;
  /** Deduplicação de escrita — o mock também implementa idempotência. */
  idempotencyKeys: Set<string>;
}

export function createMockStore(config: MockRuntimeConfig): MockStore {
  const random = createRandom(config.seed);
  const seed = buildSeedData(random);
  return {
    config,
    checkIns: new Map(),
    checkInWrites: new Map(),
    hydration: new Map(),
    ...seed,
    idempotencyKeys: new Set<string>(),
  };
}
