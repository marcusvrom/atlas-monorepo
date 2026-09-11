import { useReducer } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { PerformedSet, type ExercisePrescription, type TrainingSession } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { NumericStepper } from '../../design/components';
import { newId } from '../../lib/id';
import { t } from '../../i18n';
import { useLogSets } from './hooks';
import { SessionControls } from './SessionControls';
export function SetRecorder({
  session,
  exercise,
  previous,
  onRest,
  onPrevious,
  onNext,
  onFinish,
}: {
  session: TrainingSession;
  exercise: ExercisePrescription;
  previous: TrainingSession | null;
  onRest: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const completed = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
  const target = exercise.sets[Math.min(completed.length, exercise.sets.length - 1)]!;
  const last = previous?.sets
    .filter((set) => set.exerciseId === exercise.exerciseId)
    .at(Math.min(completed.length, exercise.sets.length - 1));
  const [input, change] = useReducer(
    (
      state: { weight: number; reps: number; rir: number; duration: number },
      patch: Partial<typeof state>,
    ) => ({ ...state, ...patch }),
    {
      weight: target.targetWeightKg ?? last?.weightKg ?? 0,
      reps: target.targetReps ?? last?.reps ?? 1,
      rir: target.targetRir ?? last?.rir ?? 2,
      duration: target.targetDurationSeconds ?? last?.durationSeconds ?? 0,
    },
  );
  const log = useLogSets(session.id);
  const record = () => {
    const set = PerformedSet.parse({
      clientGeneratedId: newId(),
      exerciseId: exercise.exerciseId,
      order: completed.length + 1,
      weightKg: input.weight,
      reps: target.targetDurationSeconds === null ? input.reps : null,
      durationSeconds: target.targetDurationSeconds === null ? null : input.duration,
      rpe: null,
      rir: input.rir,
      isWarmup: target.isWarmup,
      painLevel: null,
      performedAt: new Date().toISOString(),
    });
    log.mutate([set]);
    onRest(target.restSeconds);
  };
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <NumericStepper
          label={t('planWeight')}
          value={input.weight}
          step={0.5}
          min={0}
          onChange={(weight) => change({ weight })}
        />
        {target.targetDurationSeconds === null ? (
          <NumericStepper
            label={t('sessionReps')}
            value={input.reps}
            min={0}
            onChange={(reps) => change({ reps })}
          />
        ) : (
          <NumericStepper
            label={t('sessionSeconds')}
            value={input.duration}
            min={0}
            onChange={(duration) => change({ duration })}
          />
        )}
        <NumericStepper
          label={t('planRir')}
          value={input.rir}
          min={0}
          max={10}
          onChange={(rir) => change({ rir })}
        />
      </ScrollView>
      <View style={styles.floating}>
        <SessionControls
          onRecord={record}
          onPrevious={onPrevious}
          onNext={onNext}
          onFinish={onFinish}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  form: { gap: spacing.md, paddingBottom: spacing.huge * 2 + spacing.xxl },
  floating: { position: 'absolute', left: spacing.none, right: spacing.none, bottom: spacing.none },
});
