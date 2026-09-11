import type {
  MeasurementEntry,
  MetricKey,
  MetricSeries,
  Page,
  RecordMeasurementInput,
} from '@atlas/contracts';

export interface MeasurementPort {
  record(input: RecordMeasurementInput): Promise<MeasurementEntry>;
  list(params?: { cursor?: string | null; limit?: number }): Promise<Page<MeasurementEntry>>;
  /** `smoothing` aplica média móvel de 7 dias no servidor. Ver @atlas/domain. */
  getSeries(params: {
    metric: MetricKey;
    fromIso: string;
    toIso: string;
    smoothing?: 'none' | 'ma7';
  }): Promise<MetricSeries>;
}
