import { z } from 'zod';
import { Instant, MeasurementId } from '../primitives.js';

export const MeasurementSource = z.enum([
  'manual', 'smartScale', 'wearable', 'professionalAssessment',
]);
export type MeasurementSource = z.infer<typeof MeasurementSource>;

export const Circumferences = z.object({
  chestCm: z.number().positive().nullable(),
  waistCm: z.number().positive().nullable(),
  hipCm: z.number().positive().nullable(),
  rightArmCm: z.number().positive().nullable(),
  leftArmCm: z.number().positive().nullable(),
  rightThighCm: z.number().positive().nullable(),
  leftThighCm: z.number().positive().nullable(),
});
export type Circumferences = z.infer<typeof Circumferences>;

export const MeasurementEntry = z.object({
  id: MeasurementId,
  takenAt: Instant,
  source: MeasurementSource,
  weightKg: z.number().min(20).max(400).nullable(),
  bodyFatPct: z.number().min(2).max(70).nullable(),
  /** Derivado, nunca informado diretamente: weight × (1 − bodyFat). */
  leanMassKg: z.number().min(0).nullable(),
  circumferences: Circumferences.nullable(),
  notes: z.string().nullable(),
  hasPhotos: z.boolean().default(false),
});
export type MeasurementEntry = z.infer<typeof MeasurementEntry>;

export const MetricKey = z.enum(['weight', 'bodyFat', 'leanMass', 'waist']);
export type MetricKey = z.infer<typeof MetricKey>;

export const MetricPoint = z.object({
  at: Instant,
  raw: z.number(),
  /** Média móvel de 7 dias. Peso diário cru é ruído — a UI plota o suavizado. */
  smoothed: z.number().nullable(),
});
export type MetricPoint = z.infer<typeof MetricPoint>;

export const MetricSeries = z.object({
  metric: MetricKey,
  unit: z.string(),
  points: z.array(MetricPoint),
  trendPerWeek: z.number().nullable(),
});
export type MetricSeries = z.infer<typeof MetricSeries>;

export const RecordMeasurementInput = z.object({
  clientGeneratedId: z.uuid(),
  takenAt: Instant,
  weightKg: z.number().min(20).max(400).nullable(),
  bodyFatPct: z.number().min(2).max(70).nullable(),
  circumferences: Circumferences.nullable(),
  notes: z.string().max(500).nullable(),
});
export type RecordMeasurementInput = z.infer<typeof RecordMeasurementInput>;
