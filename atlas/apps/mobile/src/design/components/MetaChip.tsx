import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { cover, glass, layout, palette, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/**
 * Pílula de metadado — "32 min", "8 exercícios", "Avançado".
 *
 * É o padrão que as referências usam para dar densidade sem texto corrido:
 * três a quatro chips numa linha dizem o mesmo que um parágrafo e são lidos
 * de relance. Não é interativo de propósito; chip clicável é `<Chip>`.
 *
 * `onCover` troca o esquema para vidro claro sobre a arte de capa, onde a
 * superfície do tema não tem contraste suficiente.
 */
export function MetaChip({
  icon,
  label,
  onCover = false,
}: {
  icon?: IconName;
  label: string;
  onCover?: boolean;
}) {
  const { colors } = useTheme();
  const tint = onCover ? palette.ink900 : colors.textSecondary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          borderWidth: glass.borderWidth,
          borderColor: onCover ? cover.onCoverBorder : colors.border,
          backgroundColor: onCover ? cover.onCoverSurface : colors.backgroundElevated,
        },
        label: { color: tint },
      }),
    [colors, onCover, tint],
  );

  return (
    <View style={styles.root}>
      {icon ? <Icon name={icon} color={tint} size={layout.iconSize * 0.7} /> : null}
      <Text variant="footnote" weight="medium" style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

/** Linha de chips com quebra — nunca corta metadado fora da tela. */
export function MetaChipRow({ children }: { children: React.ReactNode }) {
  return <View style={rowStyles.root}>{children}</View>;
}

const rowStyles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
});
