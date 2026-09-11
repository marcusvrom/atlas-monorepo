import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecordMeasurementInput } from '@atlas/contracts';
import { useApi } from '../api-provider';
import { queryKeys } from '../query-keys';
export function useRecordMeasurement() {
  const api = useApi(),
    cache = useQueryClient();
  return useMutation({
    mutationFn: (value: RecordMeasurementInput) =>
      api.measurement.record(RecordMeasurementInput.parse(value)),
    onSuccess: () => cache.invalidateQueries({ queryKey: queryKeys.measurement.all }),
  });
}
