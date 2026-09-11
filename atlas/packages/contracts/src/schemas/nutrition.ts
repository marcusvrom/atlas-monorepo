import { z } from 'zod';
import { Instant } from '../primitives.js';

/**
 * ATL-NUT-001 — metas metabólicas e hidratação.
 *
 * Trazido do `marcusvrom/healthapp` (AiraFit). O Atlas já coletava peso,
 * altura, data de nascimento e objetivo; o que faltava era transformar isso em
 * um número que o usuário usa no mesmo dia. A matemática vive em
 * `@atlas/domain` (`metabolism.ts`) — aqui está só a fronteira.
 *
 * ⚠️ Estes números são **estimativa de necessidade energética**, não
 * prescrição dietética. O campo `disclaimerKey` existe para obrigar a tela a
 * dizer isso: nenhuma superfície do app pode exibir a meta sem ele.
 */

/**
 * Sexo biológico, usado apenas na equação de Mifflin-St Jeor. É separado de
 * identidade de gênero de propósito — a fórmula pede a variável fisiológica, e
 * `unspecified` é opção de primeira classe, não um erro de preenchimento.
 */
export const BiologicalSex = z.enum(['male', 'female', 'unspecified']);
export type BiologicalSex = z.infer<typeof BiologicalSex>;

/** Nível de atividade (PAL). Ver `ACTIVITY_MULTIPLIER` em @atlas/domain. */
export const ActivityLevel = z.enum(['sedentary', 'light', 'moderate', 'high', 'athlete']);
export type ActivityLevel = z.infer<typeof ActivityLevel>;

export const MacroTargets = z.object({
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
  /**
   * Calorias que os macros somam. Pode divergir de `targetKcal` quando o piso
   * proteico não cabe num alvo muito baixo — a tela mostra a diferença em vez
   * de esconder. Ver `macroTargets` em @atlas/domain.
   */
  energyFromMacrosKcal: z.number().min(0),
});
export type MacroTargets = z.infer<typeof MacroTargets>;

export const DailyTargets = z.object({
  /** Versão da fórmula que produziu estes números. Ver spec 00 §11.4. */
  formulaVersion: z.number().int().min(1),
  basalKcal: z.number().min(0),
  maintenanceKcal: z.number().min(0),
  goalAdjustmentKcal: z.number(),
  targetKcal: z.number().min(0),
  macros: MacroTargets,
  waterMl: z.number().int().min(0),
  /**
   * Quais dados faltaram para o cálculo. Vazio = estimativa completa. A tela
   * usa isto para pedir o que falta em vez de mostrar zero sem explicação.
   */
  missingInputs: z.array(z.enum(['weight', 'height', 'birthDate', 'sex', 'goal'])),
  /** Chave i18n do aviso obrigatório de que isto não é prescrição. */
  disclaimerKey: z.string().min(1),
  computedAt: Instant,
});
export type DailyTargets = z.infer<typeof DailyTargets>;

export const WaterReminder = z.object({
  /** "HH:MM" no fuso local do usuário. */
  time: z.string().regex(/^\d{2}:\d{2}$/),
  volumeMl: z.number().int().min(0),
});
export type WaterReminder = z.infer<typeof WaterReminder>;

export const HydrationDay = z.object({
  /** "YYYY-MM-DD" local. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetMl: z.number().int().min(0),
  consumedMl: z.number().int().min(0),
  schedule: z.array(WaterReminder),
});
export type HydrationDay = z.infer<typeof HydrationDay>;

/**
 * Registro de um copo. Carrega `clientGeneratedId` como toda escrita do app:
 * reenvio é no-op, nunca duplica o volume. Ver AGENTS.md R7.
 */
export const LogWaterInput = z.object({
  clientGeneratedId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  volumeMl: z.number().int().min(1).max(3000),
});
export type LogWaterInput = z.infer<typeof LogWaterInput>;

export const HydrationDayList = z.array(HydrationDay);
