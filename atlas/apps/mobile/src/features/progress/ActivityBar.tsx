import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { chart, gradients, opacity, radius, spacing } from '@atlas/design-tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../design/theme-provider';
import { Text } from '../../design/components';

const TRACK_HEIGHT = spacing.huge * 2;

/**
 * Uma coluna do gráfico de atividade da semana.
 *
 * Duas mudanças em relação à versão anterior, ambas vindas das referências
 * ("Weekly Stats"): a barra corre de **baixo para cima** com o tom claro no
 * topo — a luz vem de cima, como no resto do app — e a seleção deixa de ser só
 * opacidade, ganhando um trilho de fundo e a pílula do rótulo. Sem o trilho, um
 * dia com volume zero desaparecia da semana e o usuário lia o gráfico como se
 * o dia não existisse.
 */
export function ActivityBar({
  value,
  max,
  label,
  selected,
  onPress,
}: {
  value: number;
  max: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
        track: {
          height: TRACK_HEIGHT,
          width: '100%',
          justifyContent: 'flex-end',
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        bar: {
          // Mínimo visível mesmo com volume zero: a coluna vira um traço, não
          // um buraco. A leitura "treinei pouco" é diferente de "não há dado".
          height: Math.max(spacing.xs, ratio * TRACK_HEIGHT),
          borderRadius: radius.sm,
          opacity: selected ? 1 : chart.barIdleOpacity,
        },
        labelPill: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xxs,
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.brand : 'transparent',
        },
        label: { textAlign: 'center' },
        pressed: { opacity: opacity.pressed },
      }),
    [colors, ratio, selected],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label + ': ' + value.toLocaleString('pt-BR')}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.track}>
        <LinearGradient
          colors={gradients.brand.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bar}
        />
      </View>
      <View style={styles.labelPill}>
        <Text
          variant="caption"
          tone={selected ? 'onAccent' : 'secondary'}
          weight={selected ? 'bold' : 'regular'}
          style={styles.label}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
