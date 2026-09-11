import { formatCount, formatWeight } from '../../lib/format';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PerformedSet } from '@atlas/contracts';
import { glass, radius, spacing } from '@atlas/design-tokens';
import { Badge, Icon, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';

/**
 * ATL-SES-005 — uma série já registrada.
 *
 * Antes era uma linha de texto corrido ("Série em edição 1: 90 kg × 7"). Agora
 * o número da série vira pastilha, carga e repetições ficam em peso de leitura
 * diferente, e a série que bateu recorde recebe selo.
 *
 * O selo é o ponto: `recordSetIds` já sabia identificar a série desde o
 * resumo, mas o usuário só descobria no fim do treino. Marcar aqui é o que
 * transforma o recorde em um momento — que é o que ele é.
 */
export function SetRow({
  set,
  order,
  isRecord,
}: {
  set: PerformedSet;
  order: number;
  isRecord: boolean;
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.lg,
          borderWidth: glass.borderWidth,
          borderColor: isRecord ? colors.success : colors.border,
          backgroundColor: colors.surface,
        },
        order: {
          width: spacing.xxl,
          height: spacing.xxl,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.backgroundElevated,
        },
        copy: { flex: 1, gap: spacing.xxs },
        meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
      }),
    [colors, isRecord],
  );

  const load = set.weightKg === null ? null : formatWeight(set.weightKg) + ' kg';
  const effort =
    set.reps !== null
      ? formatCount(set.reps) + ' ' + t('repsShort')
      : (set.durationSeconds ?? 0) + ' ' + t('secondsShort');

  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={
        t('planSetNumber') +
        ' ' +
        order +
        ': ' +
        (load ? load + ', ' : '') +
        effort +
        (isRecord ? '. ' + t('sessionNewRecord') : '')
      }
    >
      <View style={styles.order}>
        <Text variant="footnote" weight="bold" tone={isRecord ? 'success' : 'secondary'}>
          {order}
        </Text>
      </View>
      <View style={styles.copy}>
        <Text weight="semibold">
          {load ? load + ' · ' : ''}
          {effort}
        </Text>
        {set.rir !== null ? (
          <Text variant="caption" tone="tertiary">
            {t('sessionRirShort')}: {set.rir}
          </Text>
        ) : null}
      </View>
      {isRecord ? (
        <View style={styles.meta}>
          <Icon name="trophy" size={spacing.lg} color={colors.success} />
          <Badge label={t('sessionNewRecord')} tone="success" />
        </View>
      ) : set.isWarmup ? null : (
        <Icon name="check" size={spacing.lg} color={colors.textTertiary} />
      )}
    </View>
  );
}
