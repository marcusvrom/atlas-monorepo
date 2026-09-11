import type { GoalType } from '@atlas/contracts';

/**
 * Motor metabólico — TMB, gasto energético, macros e hidratação.
 *
 * Portado de `marcusvrom/healthapp` (AiraFit, `CalculationService`), que é um
 * backend Node/TypeORM. O que veio foi a **regra**, não o código: lá a
 * matemática mora numa classe estática com acesso a entidades; aqui ela é
 * função pura em `@atlas/domain`, do mesmo jeito que 1RM e volume — nenhuma
 * tela e nenhum adapter recalcula nada por conta própria.
 *
 * Como as demais fórmulas deste pacote, é **versionada**: um alvo calórico
 * registrado hoje precisa continuar reproduzível depois de a fórmula evoluir.
 * Ao mudar qualquer constante, crie uma versão nova. Ver spec 00 §11.4.
 *
 * ⚠️ Escopo: isto estima necessidade energética para treino e composição
 * corporal. **Não é prescrição dietética nem conduta clínica.** O app precisa
 * apresentar os números como estimativa e nunca como recomendação médica.
 */

export const METABOLISM_VERSION = 1 as const;

export type BiologicalSex = 'male' | 'female' | 'unspecified';

/**
 * Nível de atividade (PAL). Os multiplicadores são os de Mifflin-St Jeor,
 * iguais aos do healthapp — os nomes é que foram traduzidos para a escala do
 * Atlas, que fala de treino e não de tipo de emprego.
 */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

/**
 * Ajuste calórico por objetivo, em kcal/dia sobre o gasto total.
 *
 * O healthapp tinha cinco objetivos próprios (incluindo `diabetico`); o Atlas
 * tem os seus seis em `GoalType`. O mapeamento é deliberado, não automático:
 * `strength` ganha um superávit menor que `hypertrophy` porque o objetivo é
 * carga e não massa, e `rehabilitation` fica em zero — não é hora de manipular
 * energia. `-500` e `+400` vêm da fonte.
 */
export const GOAL_ENERGY_ADJUSTMENT: Record<GoalType, number> = {
  fatLoss: -500,
  hypertrophy: 400,
  strength: 200,
  endurance: 0,
  rehabilitation: 0,
  generalHealth: 0,
};

/** Proteína base e teto, em g por kg de peso-base. */
export const PROTEIN_BASE_G_PER_KG = 1.6;
export const PROTEIN_CEILING_G_PER_KG = 2.0;
/** Fração das calorias destinada a gordura no caminho padrão. */
export const FAT_ENERGY_SHARE = 0.25;
/** Gordura mínima, em g/kg — piso de segurança para a via com teto de carbo. */
export const FAT_FLOOR_G_PER_KG = 0.8;
/** Água: 35 ml por kg de peso corporal. */
export const WATER_ML_PER_KG = 35;
/** IMC a partir do qual o peso-base passa a ser ajustado (PCA). */
export const ADJUSTED_WEIGHT_BMI_THRESHOLD = 25;

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export interface BodyInput {
  readonly weightKg: number;
  readonly heightCm: number;
  readonly ageYears: number;
  readonly sex: BiologicalSex;
}

/**
 * Taxa metabólica basal — Mifflin-St Jeor.
 *
 *   homem:  (10 × peso) + (6,25 × altura) − (5 × idade) + 5
 *   mulher: (10 × peso) + (6,25 × altura) − (5 × idade) − 161
 *
 * Para `unspecified` usamos a média das duas constantes (−78). É uma
 * aproximação assumida: quem não informa sexo biológico recebe uma estimativa
 * intermediária em vez de ser excluído do cálculo ou classificado à força.
 */
export function basalMetabolicRate(body: BodyInput): number {
  const { weightKg, heightCm, ageYears, sex } = body;
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : (5 - 161) / 2;
  return Math.max(0, round2(base + offset));
}

/** Gasto energético total = TMB × multiplicador de atividade. */
export function totalEnergyExpenditure(bmr: number, activity: ActivityLevel): number {
  return round2(bmr * ACTIVITY_MULTIPLIER[activity]);
}

/** Gasto de uma sessão pelo MET: kcal = MET × peso(kg) × horas. */
export function exerciseCalories(met: number, weightKg: number, minutes: number): number {
  if (met <= 0 || weightKg <= 0 || minutes <= 0) return 0;
  return round2(met * weightKg * (minutes / 60));
}

/**
 * Peso-base para o cálculo de proteína — PCA (peso corporal ajustado).
 *
 * 1. Peso-alvo informado vence: é a intenção explícita do usuário.
 * 2. IMC ≤ 25 → peso atual, sem ajuste.
 * 3. IMC > 25 → `PI + 0,25 × (atual − PI)`, com `PI = 25 × altura²`.
 *
 * O passo 3 é o que impede a proteína de inflar: multiplicar 1,6 g/kg pelo peso
 * total de quem carrega excesso de gordura prescreve muito acima do que o
 * tecido magro pede. O fator 0,25 reconhece que massa gorda ainda demanda
 * alguma proteína de manutenção.
 */
export function adjustedBodyWeight(
  weightKg: number,
  heightCm: number,
  targetWeightKg?: number | null,
): number {
  if (targetWeightKg != null && targetWeightKg > 0) return round2(targetWeightKg);
  if (weightKg <= 0 || heightCm <= 0) return 0;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (bmi <= ADJUSTED_WEIGHT_BMI_THRESHOLD) return round2(weightKg);

  const idealWeight = ADJUSTED_WEIGHT_BMI_THRESHOLD * heightM * heightM;
  return round2(idealWeight + 0.25 * (weightKg - idealWeight));
}

export interface MacroTargets {
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  /**
   * Calorias que os macros efetivamente somam. Pode passar de
   * `energyKcal` quando proteína + gordura mínima já estouram um alvo muito
   * baixo — nesse caso o carboidrato zera e **o piso proteico vence**, porque
   * cortar proteína para caber na conta é exatamente o que não se deve fazer
   * num déficit. A tela deve mostrar esse desencontro em vez de escondê-lo.
   */
  readonly energyFromMacrosKcal: number;
}

export interface MacroInput {
  readonly energyKcal: number;
  readonly weightKg: number;
  readonly heightCm: number;
  readonly targetWeightKg?: number | null;
  /** Estímulo de hipertrofia (0–10); a partir de 8, proteína vai ao teto. */
  readonly hypertrophyStimulus?: number;
  /**
   * Teto de carboidrato como fração das calorias (ex.: 0.4). Usado por
   * protocolos low-carb. É um parâmetro de cálculo, não um diagnóstico: o
   * healthapp amarrava isto a um objetivo "diabético", e trazer aquele rótulo
   * transformaria uma estimativa em alegação clínica. Quem decide aplicá-lo é
   * o profissional, fora deste módulo.
   */
  readonly carbCeilingShare?: number | null;
}

export const HYPERTROPHY_STIMULUS_THRESHOLD = 8;

export function macroTargets(input: MacroInput): MacroTargets {
  const energy = Math.max(0, input.energyKcal);
  const base = adjustedBodyWeight(input.weightKg, input.heightCm, input.targetWeightKg);
  const highStimulus = (input.hypertrophyStimulus ?? 0) >= HYPERTROPHY_STIMULUS_THRESHOLD;

  const proteinG = round2(base * (highStimulus ? PROTEIN_CEILING_G_PER_KG : PROTEIN_BASE_G_PER_KG));
  const proteinKcal = proteinG * KCAL_PER_G.protein;

  let fatG: number;
  let carbsG: number;

  if (input.carbCeilingShare != null && input.carbCeilingShare > 0) {
    // Via com teto de carboidrato: proteína no teto, carbo limitado, gordura
    // recebe o resto — mas nunca abaixo do piso de segurança.
    const fatFloorKcal = base * FAT_FLOOR_G_PER_KG * KCAL_PER_G.fat;
    const carbsKcal = Math.max(
      0,
      Math.min(energy * input.carbCeilingShare, energy - proteinKcal - fatFloorKcal),
    );
    carbsG = round2(carbsKcal / KCAL_PER_G.carbs);
    fatG = round2(
      Math.max(fatFloorKcal, energy - proteinKcal - carbsG * KCAL_PER_G.carbs) / KCAL_PER_G.fat,
    );
  } else {
    const fatKcal = energy * FAT_ENERGY_SHARE;
    fatG = round2(fatKcal / KCAL_PER_G.fat);
    carbsG = round2(Math.max(0, energy - proteinKcal - fatKcal) / KCAL_PER_G.carbs);
  }

  return {
    proteinG,
    carbsG,
    fatG,
    energyFromMacrosKcal: round2(
      proteinG * KCAL_PER_G.protein + carbsG * KCAL_PER_G.carbs + fatG * KCAL_PER_G.fat,
    ),
  };
}

/** Meta diária de água: 35 ml por kg. */
export function dailyWaterMl(weightKg: number): number {
  return weightKg > 0 ? Math.round(weightKg * WATER_ML_PER_KG) : 0;
}

export interface WaterReminder {
  /** "HH:MM" no fuso local do usuário. */
  readonly time: string;
  readonly volumeMl: number;
}

/**
 * Distribui a meta de água pela janela acordada.
 *
 * Primeiro lembrete 15 min depois de acordar, último 60 min antes de dormir —
 * beber o resto da meta na hora de deitar só rende ida ao banheiro de
 * madrugada, que é justamente o que atrapalha a recuperação.
 *
 * Janelas que cruzam a meia-noite (dormir às 02:00) são tratadas somando 24 h,
 * e não descartadas: quem treina à noite frequentemente tem esse horário.
 */
export function waterSchedule(
  totalMl: number,
  wakeTime: string,
  sleepTime: string,
  intervalMin = 45,
): WaterReminder[] {
  const total = Math.max(0, Math.round(totalMl));
  if (total === 0 || intervalMin <= 0) return [];

  const start = timeToMinutes(wakeTime) + 15;
  let end = timeToMinutes(sleepTime) - 60;
  if (end <= start) end += 24 * 60;
  if (end <= start) return [{ time: minutesToTime(start), volumeMl: total }];

  const slots: number[] = [];
  for (let cursor = start; cursor <= end; cursor += intervalMin) slots.push(cursor);
  if (!slots.length) return [{ time: minutesToTime(start), volumeMl: total }];

  const perSlot = Math.floor(total / slots.length);
  const remainder = total - perSlot * slots.length;
  return slots.map((minutes, index) => ({
    time: minutesToTime(minutes),
    // A sobra da divisão vai no último copo, para a soma bater com a meta.
    volumeMl: index === slots.length - 1 ? perSlot + remainder : perSlot,
  }));
}

export interface MetabolicSummary {
  readonly version: typeof METABOLISM_VERSION;
  readonly basalKcal: number;
  readonly maintenanceKcal: number;
  readonly goalAdjustmentKcal: number;
  readonly targetKcal: number;
  readonly macros: MacroTargets;
  readonly waterMl: number;
}

export interface MetabolicInput extends BodyInput {
  readonly activity: ActivityLevel;
  readonly goal: GoalType;
  readonly targetWeightKg?: number | null;
  readonly hypertrophyStimulus?: number;
  readonly carbCeilingShare?: number | null;
}

/**
 * Resumo metabólico do dia.
 *
 * Nota que vale registrar, porque é contraintuitiva e veio da fonte: as
 * calorias do treino **não** são somadas ao gasto de manutenção. O
 * multiplicador de atividade (PAL) já embute o treino habitual; somar a sessão
 * de novo contaria o mesmo esforço duas vezes e inflaria a meta — erro comum em
 * apps de nutrição. `exerciseCalories` existe para mostrar o gasto da sessão ao
 * usuário, não para entrar nesta conta.
 */
export function metabolicSummary(input: MetabolicInput): MetabolicSummary {
  const basalKcal = basalMetabolicRate(input);
  const maintenanceKcal = totalEnergyExpenditure(basalKcal, input.activity);
  const goalAdjustmentKcal = GOAL_ENERGY_ADJUSTMENT[input.goal];
  const targetKcal = Math.max(0, round2(maintenanceKcal + goalAdjustmentKcal));

  return {
    version: METABOLISM_VERSION,
    basalKcal,
    maintenanceKcal,
    goalAdjustmentKcal,
    targetKcal,
    // `exactOptionalPropertyTypes` está ligado: campo opcional ausente e campo
    // opcional com `undefined` são coisas diferentes para o compilador. Por isso
    // normalizamos para `null` em vez de repassar o `undefined` adiante.
    macros: macroTargets({
      energyKcal: targetKcal,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      targetWeightKg: input.targetWeightKg ?? null,
      hypertrophyStimulus: input.hypertrophyStimulus ?? 0,
      carbCeilingShare: input.carbCeilingShare ?? null,
    }),
    waterMl: dailyWaterMl(input.weightKg),
  };
}

/** Idade em anos a partir de uma data de nascimento ISO (YYYY-MM-DD). */
export function ageFromBirthDate(birthDateIso: string, nowIso: string): number {
  const birth = new Date(birthDateIso);
  const now = new Date(nowIso);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(now.getTime())) return 0;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  // Ainda não fez aniversário este ano.
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return Math.max(0, age);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(24 * 60 - 1, (h ?? 0) * 60 + (m ?? 0)));
}

export function minutesToTime(minutes: number): string {
  const normalised = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
