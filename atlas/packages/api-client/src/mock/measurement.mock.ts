import {
  MeasurementEntry as EntrySchema,
  MetricSeries as SeriesSchema,
  RecordMeasurementInput as InputSchema,
  page,
  type MeasurementEntry,
  type MeasurementId,
  type MetricKey,
  type MetricSeries,
  type Page,
  type RecordMeasurementInput,
} from '@atlas/contracts';
import { leanMass, movingAverage, weeklyTrend } from '@atlas/domain';
import type { MeasurementPort } from '../ports/measurement.port.js';
import { simulate } from './runtime.js';
import type { MockStore } from './store.js';

export class MockMeasurementAdapter implements MeasurementPort {
  constructor(private readonly store: MockStore) {}

  async record(input: RecordMeasurementInput): Promise<MeasurementEntry> {
    return simulate(this.store.config, () => {
      input = InputSchema.parse(input);
      const existing = this.store.measurements.find((m) => m.id === input.clientGeneratedId);
      if (existing) return EntrySchema.parse(existing);

      const entry: MeasurementEntry = {
        id: input.clientGeneratedId as MeasurementId,
        takenAt: input.takenAt,
        source: 'manual',
        weightKg: input.weightKg,
        bodyFatPct: input.bodyFatPct,
        // Massa magra é sempre derivada, nunca informada. Ver spec 00 §4.5.
        leanMassKg:
          input.weightKg !== null && input.bodyFatPct !== null
            ? leanMass(input.weightKg, input.bodyFatPct)
            : null,
        circumferences: input.circumferences,
        notes: input.notes,
        hasPhotos: false,
      };
      this.store.measurements.unshift(entry);
      this.store.measurements.sort(
        (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
      );
      return EntrySchema.parse(entry);
    });
  }

  async list(params?: { cursor?: string | null; limit?: number }): Promise<Page<MeasurementEntry>> {
    return simulate(this.store.config, () => {
      const limit = params?.limit ?? 20;
      const start = params?.cursor ? Number.parseInt(params.cursor, 10) : 0;
      return page(EntrySchema).parse({
        items: this.store.measurements.slice(start, start + limit),
        nextCursor: start + limit < this.store.measurements.length ? String(start + limit) : null,
      });
    });
  }

  async getSeries(params: {
    metric: MetricKey;
    fromIso: string;
    toIso: string;
    smoothing?: 'none' | 'ma7';
  }): Promise<MetricSeries> {
    return simulate(this.store.config, () => {
      const from = new Date(params.fromIso).getTime();
      const to = new Date(params.toIso).getTime();

      const entries = [...this.store.measurements]
        .filter((m) => {
          const t = new Date(m.takenAt).getTime();
          return t >= from && t <= to;
        })
        .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime());

      const raw = entries
        .map((m) => ({ at: m.takenAt, value: pick(m, params.metric) }))
        .filter((p): p is { at: string; value: number } => p.value !== null);

      const smoothed =
        params.smoothing === 'none'
          ? raw.map(() => null)
          : raw.map((point, index) => {
              const window = raw
                .slice(0, index + 1)
                .filter((entry) => Date.parse(entry.at) > Date.parse(point.at) - 7 * 86400000)
                .map((entry) => entry.value);
              return movingAverage(window, window.length).at(-1) ?? null;
            });

      return SeriesSchema.parse({
        metric: params.metric,
        unit: params.metric === 'bodyFat' ? '%' : params.metric === 'waist' ? 'cm' : 'kg',
        points: raw.map((p, i) => ({
          at: p.at,
          raw: p.value,
          smoothed: smoothed[i] ?? null,
        })),
        trendPerWeek: weeklyTrend(
          raw.map((p) => ({ atMs: new Date(p.at).getTime(), value: p.value })),
        ),
      });
    });
  }
}

function pick(m: MeasurementEntry, metric: MetricKey): number | null {
  switch (metric) {
    case 'weight':
      return m.weightKg;
    case 'bodyFat':
      return m.bodyFatPct;
    case 'leanMass':
      return m.leanMassKg;
    case 'waist':
      return m.circumferences?.waistCm ?? null;
    default:
      return null;
  }
}
