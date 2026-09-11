import { Pressable, StyleSheet, View } from 'react-native';
import type { ExercisePrescription } from '@atlas/contracts';
import { layout, opacity, spacing } from '@atlas/design-tokens';
import { CoverImage, Icon, Text } from '../../design/components';
import { prescriptionSummary } from './prescription-summary';
import { t } from '../../i18n';

/**
 * Linha de prescrição dentro do dia.
 *
 * Ganhou a miniatura de capa: é o que dá à lista a densidade visual das
 * referências e, na prática, o que permite achar um exercício conhecido pela
 * cor antes de ler o nome. O número da ordem foi para cima da capa, liberando
 * a coluna de texto inteira para nome e prescrição.
 */
export function PrescriptionRow({
  exercise,
  onPress,
}: {
  exercise: ExercisePrescription;
  onPress: () => void;
}) {
  const summary = prescriptionSummary(exercise);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.exerciseName + ', ' + t('dashboardExerciseGuide')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <CoverImage
        seed={exercise.exerciseId}
        uri={exercise.thumbnailUrl}
        radius="md"
        style={styles.cover}
      >
        <Text variant="caption" tone="onAccent" weight="bold" style={styles.order}>
          {String(exercise.order).padStart(2, '0')}
        </Text>
      </CoverImage>
      <View style={styles.copy}>
        <Text weight="semibold" numberOfLines={1}>
          {exercise.exerciseName}
        </Text>
        <Text variant="footnote" tone="secondary">
          {summary.sets} · {summary.rest}
        </Text>
        {summary.rir ? (
          <Text variant="footnote" tone="tertiary">
            {summary.rir}
          </Text>
        ) : null}
      </View>
      <Icon name="arrow" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  cover: { width: layout.thumbnail, height: layout.thumbnail },
  order: { position: 'absolute', left: spacing.xs, top: spacing.xs },
  copy: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: opacity.pressed },
});
