import { Pressable, StyleSheet, View } from 'react-native';
import { layout, opacity, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Icon } from './Icon';
import { Text } from './Text';

/**
 * Cabeçalho de seção com ação à direita — o par "Today's Workout / view all"
 * que se repete em todas as referências.
 *
 * Serve para a tela poder mostrar **uma amostra** de uma coleção grande e
 * empurrar o resto para uma rota própria, em vez de despejar tudo numa rolagem
 * infinita. Sem `onAction` vira só um título de seção.
 */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text variant="title2" weight="bold" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text variant="subhead" tone="brand" weight="semibold">
            {actionLabel}
          </Text>
          <Icon name="arrow" color={colors.brand} size={layout.iconSize * 0.85} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    // Alvo de toque de 44 pt mesmo com o rótulo curto.
    minHeight: spacing.xxxl,
    paddingLeft: spacing.sm,
  },
  pressed: { opacity: opacity.pressed },
});
