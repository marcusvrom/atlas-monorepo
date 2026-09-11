import { Pressable, StyleSheet, View } from 'react-native';
import type { ExercisePrescription } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Text, Icon } from '../../design/components';
import { t } from '../../i18n';
export function PrescriptionRow({
  exercise,
  onPress,
}: {
  exercise: ExercisePrescription;
  onPress: () => void;
}) {
  const first = exercise.sets[0]!;
  const reps =
    first.targetDurationSeconds !== null
      ? first.targetDurationSeconds + ' ' + t('sessionSeconds')
      : (first.targetReps ?? '—') +
        (first.targetRepsMax ? '–' + first.targetRepsMax : '') +
        ' ' +
        t('sessionReps').toLowerCase();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.exerciseName + ', ' + t('dashboardExerciseGuide')}
      onPress={onPress}
      style={styles.row}
    >
      <Text variant="footnote" tone="brand" weight="bold">
        {String(exercise.order).padStart(2, '0')}
      </Text>
      <View style={styles.copy}>
        <Text weight="semibold">{exercise.exerciseName}</Text>
        <Text variant="footnote" tone="secondary">
          {exercise.sets.length +
            ' × ' +
            reps +
            ' · ' +
            first.restSeconds +
            ' ' +
            t('sessionSeconds')}
        </Text>
        {first.targetRir !== null ? (
          <Text variant="footnote" tone="secondary">
            {t('planRir')}: {first.targetRir}
          </Text>
        ) : null}
      </View>
      <Icon name="arrow" />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  copy: { flex: 1, gap: spacing.xs },
});
