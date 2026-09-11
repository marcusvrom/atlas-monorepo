import { useState } from 'react';
import {
  Sheet,
  Button,
  Card,
  Text,
  LoadingState,
  ErrorState,
  Sparkline,
} from '../../design/components';
import { ExercisePicker } from '../plans/ExercisePicker';
import type { ExerciseId } from '@atlas/contracts';
import { acuteChronicWorkloadRatio } from '@atlas/domain';
import { formatRatio } from '../../lib/format';
import { t } from '../../i18n';
import { useExerciseProgression } from './hooks';
import { useDashboardSessions } from '../../data/queries/dashboard';
export function StrengthSection() {
  const [id, setId] = useState<ExerciseId>(),
    [open, setOpen] = useState(false);
  const progression = useExerciseProgression(id),
    history = useDashboardSessions();
  const [since] = useState(() => Date.now());
  const sum = (days: number) =>
    history.data
      ?.filter(
        (s) =>
          s.status === 'completed' &&
          Date.parse(s.startedAt) <= since &&
          Date.parse(s.startedAt) >= since - days * 86400000,
      )
      .reduce((total, s) => total + s.totalVolumeKg, 0) ?? 0;
  const ratio = acuteChronicWorkloadRatio(sum(7), sum(28));
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('strengthTitle')}
      </Text>
      {history.isPending ? (
        <LoadingState lines={1} />
      ) : history.isError ? (
        <ErrorState message={t('progressError')} onRetry={() => void history.refetch()} />
      ) : (
        <Text>
          {t('acwrLabel')}: {ratio === null ? t('insufficientHistory') : formatRatio(ratio)}
        </Text>
      )}
      <Button label={t('chooseExercise')} onPress={() => setOpen(true)} />
      {id ? (
        progression.isPending ? (
          <LoadingState />
        ) : progression.isError ? (
          <ErrorState message={t('progressError')} onRetry={() => void progression.refetch()} />
        ) : (
          <>
            <Text weight="bold">{progression.data.exerciseName}</Text>
            <Sparkline
              label={t('oneRepMax')}
              values={progression.data.points.map((point) => point.estimatedOneRepMaxKg)}
              emptyLabel={t('insufficientHistory')}
            />
            {progression.data.isStagnant ? <Text>{t('stagnationMessage')}</Text> : null}
          </>
        )
      ) : null}
      <Sheet visible={open} title={t('chooseExercise')} onClose={() => setOpen(false)}>
        <ExercisePicker
          onPick={(exercise) => {
            setId(exercise.id);
            setOpen(false);
          }}
        />
      </Sheet>
    </Card>
  );
}
