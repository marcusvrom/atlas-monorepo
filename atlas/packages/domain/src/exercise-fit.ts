import type { BodyRegion, Equipment, ExperienceLevel, Difficulty } from '@atlas/contracts';

/**
 * Adequação de um exercício ao perfil de quem treina.
 *
 * Função pura e sem I/O, como todo este pacote: a mesma regra decide o que o
 * catálogo mostra, o que o montador de ficha sugere e o que a tela explica ao
 * usuário. Duplicar essa decisão em cada tela seria repetir o erro que produziu
 * a divergência de séries efetivas entre o domínio e o mock.
 *
 * ## Três princípios
 *
 * 1. **Nada some em silêncio.** O veredito nunca é "não existe": é `avoid`,
 *    com motivo. A tela decide se esconde ou apenas marca, mas sempre tem o
 *    porquê para mostrar — e o usuário sempre tem como ver a lista inteira.
 *    Um app que apaga metade do catálogo sem dizer parece quebrado.
 * 2. **Limitação não é diagnóstico.** "Poupar o joelho" ordena o catálogo; não
 *    é prescrição, não é laudo e não substitui profissional. Por isso o
 *    vocabulário é `avoid`/`caution`, e não "contraindicado".
 * 3. **Nível filtra para cima, nunca para baixo.** Um avançado continua vendo
 *    exercício de iniciante — flexão e prancha não deixam de servir a ninguém.
 *    O que se evita é entregar agachamento livre com barra a quem nunca agachou.
 */

export const FIT_VERDICTS = ['recommended', 'suitable', 'caution', 'avoid'] as const;
export type FitVerdict = (typeof FIT_VERDICTS)[number];

/**
 * Motivo em código, nunca em texto.
 *
 * A frase que o usuário lê é problema da camada de i18n; o domínio não fala
 * português. Isto também é o que permite testar o motivo sem depender da
 * redação.
 */
export type FitReasonCode =
  | 'protectedRegion'
  | 'aboveLevel'
  | 'wellBelowLevel'
  | 'equipmentUnavailable'
  | 'matchesLevel'
  | 'jointFriendly';

export interface FitReason {
  code: FitReasonCode;
  /** Região que motivou o alerta, quando o motivo é articular. */
  region?: BodyRegion;
  /** Equipamento que falta, quando o motivo é de disponibilidade. */
  equipment?: Equipment;
}

export interface ExerciseFit {
  verdict: FitVerdict;
  reasons: FitReason[];
  /**
   * Ordenação, maior primeiro. Existe separado do veredito porque dois
   * exercícios igualmente "adequados" ainda precisam de uma ordem estável — e
   * porque a tela ordena sem reimplementar a regra.
   */
  score: number;
}

/** Entrada mínima. Aceita `ExerciseSummary` e `ExerciseDetail` sem conversão. */
export interface FitCandidate {
  readonly difficulty: Difficulty;
  readonly equipment: Equipment;
  readonly stressedRegions: readonly BodyRegion[];
}

export interface FitPreferences {
  readonly experienceLevel: ExperienceLevel;
  readonly protectedRegions: readonly BodyRegion[];
  /** `null` = sem restrição de equipamento. Ver `TrainingPreferences`. */
  readonly availableEquipment: readonly Equipment[] | null;
}

const RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Ordem da escala de dificuldade, para comparação entre exercício e usuário. */
export function difficultyRank(value: Difficulty): number {
  return RANK[value];
}

/**
 * `bodyweight` e `none` nunca são barrados por indisponibilidade: quem declarou
 * ter só o peso do corpo ainda tem o peso do corpo. Sem esta exceção, marcar
 * "nenhum equipamento" esvaziava o catálogo por completo.
 */
function isAlwaysAvailable(equipment: Equipment): boolean {
  return equipment === 'bodyweight' || equipment === 'none';
}

export function assessExercise(
  exercise: FitCandidate,
  preferences: FitPreferences | null,
): ExerciseFit {
  // Sem preferências declaradas o app não inventa perfil: tudo é adequado, e
  // nenhuma lista é filtrada pelas costas do usuário.
  if (!preferences) return { verdict: 'suitable', reasons: [], score: 0 };

  const reasons: FitReason[] = [];
  let score = 0;
  let verdict: FitVerdict = 'suitable';

  const conflicts = exercise.stressedRegions.filter((region) =>
    preferences.protectedRegions.includes(region),
  );
  for (const region of conflicts) reasons.push({ code: 'protectedRegion', region });
  if (conflicts.length > 0) {
    verdict = 'avoid';
    // Mais regiões em conflito afundam mais: entre dois exercícios a evitar, o
    // que agride só o joelho vem antes do que agride joelho, quadril e lombar.
    score -= 100 + conflicts.length * 10;
  }

  const levelGap =
    difficultyRank(exercise.difficulty) - difficultyRank(preferences.experienceLevel);
  if (levelGap > 0) {
    reasons.push({ code: 'aboveLevel' });
    // Acima do nível é cautela, não proibição — a técnica se aprende. Só
    // rebaixa quando já não havia conflito articular, que é mais grave.
    if (verdict !== 'avoid') verdict = 'caution';
    score -= 20 * levelGap;
  } else if (levelGap === 0) {
    reasons.push({ code: 'matchesLevel' });
    score += 10;
  } else {
    // Abaixo do nível continua servindo; só não é o primeiro da lista.
    if (levelGap <= -2) reasons.push({ code: 'wellBelowLevel' });
    score += 2;
  }

  if (
    preferences.availableEquipment !== null &&
    !isAlwaysAvailable(exercise.equipment) &&
    !preferences.availableEquipment.includes(exercise.equipment)
  ) {
    reasons.push({ code: 'equipmentUnavailable', equipment: exercise.equipment });
    if (verdict !== 'avoid') verdict = 'avoid';
    score -= 200;
  }

  // Poupa uma região declarada sem carregar nenhuma outra que o usuário protege:
  // é o exercício que o app deve empurrar para o topo de quem tem limitação.
  if (preferences.protectedRegions.length > 0 && conflicts.length === 0) {
    reasons.push({ code: 'jointFriendly' });
    score += 25;
  }

  if (verdict === 'suitable' && score > 0) verdict = 'recommended';

  return { verdict, reasons, score };
}

/** `true` quando o exercício não deve entrar numa lista já personalizada. */
export function isExcluded(fit: ExerciseFit): boolean {
  return fit.verdict === 'avoid';
}

/**
 * Ordena por adequação, preservando a ordem original no empate.
 *
 * O `sort` do JavaScript é estável desde o ES2019, então empate mantém a ordem
 * de catálogo — o que importa porque a ordem de catálogo já é significativa
 * (agrupada por grupo muscular) e embaralhá-la a cada render deixaria a lista
 * irreconhecível entre duas aberturas.
 */
export function rankByFit<T extends FitCandidate>(
  exercises: readonly T[],
  preferences: FitPreferences | null,
): { exercise: T; fit: ExerciseFit }[] {
  return exercises
    .map((exercise) => ({ exercise, fit: assessExercise(exercise, preferences) }))
    .sort((a, b) => b.fit.score - a.fit.score);
}

/**
 * Alternativa mais segura para um exercício a evitar: o melhor candidato que
 * trabalha o mesmo grupo e não toca nenhuma região protegida.
 *
 * Devolve `null` quando não há substituto, e isso é uma resposta legítima — é
 * melhor dizer "não temos alternativa no catálogo" do que sugerir um exercício
 * que agride a mesma articulação.
 */
export function saferAlternative<T extends FitCandidate & { primaryMuscleCode: string }>(
  exercise: T,
  catalog: readonly T[],
  preferences: FitPreferences | null,
): T | null {
  if (!preferences) return null;
  const candidates = catalog.filter(
    (item) =>
      item !== exercise &&
      item.primaryMuscleCode === exercise.primaryMuscleCode &&
      !isExcluded(assessExercise(item, preferences)),
  );
  return rankByFit(candidates, preferences)[0]?.exercise ?? null;
}
