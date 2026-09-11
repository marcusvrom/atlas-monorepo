import type { ExerciseSummary } from '@atlas/contracts';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { layout, spacing, opacity } from '@atlas/design-tokens';
import { CoverImage, Icon, MetaChip, MetaChipRow, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { equipmentLabel, difficultyLabel } from './labels';

/**
 * Linha do catálogo.
 *
 * A miniatura cinza com um ícone virou capa gerada, e os dois textos soltos
 * viraram chips. A troca não é cosmética: com 300+ exercícios, o que torna a
 * lista navegável é o par cor + forma, que o olho filtra antes de ler; os
 * chips deixam equipamento e nível comparáveis entre linhas em vez de
 * exigirem leitura linha a linha.
 */
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
          paddingVertical: spacing.md,
          borderBottomColor: colors.border,
          borderBottomWidth: spacing.xxs / 2,
        },
        thumbnail: { width: layout.coverRow, height: layout.coverRow },
        copy: { flex: 1, gap: spacing.sm },
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
      <CoverImage
        seed={exercise.id}
        uri={exercise.thumbnailUrl}
        glyph="dumbbell"
        style={styles.thumbnail}
      />
      <View style={styles.copy}>
        <Text weight="semibold" numberOfLines={2}>
          {exercise.name}
        </Text>
        <MetaChipRow>
          <MetaChip label={equipmentLabel(exercise.equipment)} />
          <MetaChip icon="target" label={difficultyLabel(exercise.difficulty)} />
        </MetaChipRow>
      </View>
      <Icon name="arrow" />
    </Pressable>
  );
}
