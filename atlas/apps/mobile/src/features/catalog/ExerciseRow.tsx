import type { ExerciseSummary } from '@atlas/contracts';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { layout, radius, spacing, opacity } from '@atlas/design-tokens';
import { Icon, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { equipmentLabel, difficultyLabel } from './labels';
export function ExerciseRow({
  exercise,
  onPress,
}: {
  exercise: ExerciseSummary;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          paddingVertical: spacing.lg,
          borderBottomColor: colors.border,
          borderBottomWidth: spacing.xxs / 2,
        },
        thumbnail: {
          width: layout.thumbnail,
          height: layout.thumbnail,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        copy: { flex: 1, gap: spacing.xs },
        pressed: { opacity: opacity.pressed },
      }),
    [colors],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={exercise.name}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.thumbnail}>
        <Icon name="dumbbell" color={colors.brand} />
      </View>
      <View style={styles.copy}>
        <Text weight="semibold">{exercise.name}</Text>
        <Text tone="secondary" variant="footnote">
          {equipmentLabel(exercise.equipment)}
        </Text>
        <Text tone="secondary" variant="footnote">
          {difficultyLabel(exercise.difficulty)}
        </Text>
      </View>
      <Icon name="arrow" />
    </Pressable>
  );
}
