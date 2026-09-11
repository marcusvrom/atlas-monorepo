import { formatWeight } from '../../lib/format-weight';
import type { SessionSummary } from '@atlas/contracts';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { glass, layout, opacity, radius, spacing } from '@atlas/design-tokens';
import { Badge, CoverImage, MetaChip, MetaChipRow, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';

/**
 * Uma sessão no histórico.
 *
 * A versão anterior empilhava quatro linhas de texto num card alto: quatro
 * sessões já enchiam a tela e a rolagem não levava a lugar nenhum. Aqui a
 * mesma informação vira capa + título + chips, o que corta a altura pela
 * metade e devolve ao histórico a função de ser **percorrido**.
 *
 * A capa é semeada pelo id da sessão, então dois treinos do mesmo dia não se
 * confundem, e o glifo muda com o estado: troféu para concluído, cronômetro
 * visual (pulso) para em andamento.
 */
export function HistoryRow({ session, onPress }: { session: SessionSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const statusKey =
    session.status === 'completed'
      ? ('historyCompleted' as const)
      : session.status === 'inProgress'
        ? ('historyInProgress' as const)
        : ('historyAbandoned' as const);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: glass.borderWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        cover: { width: layout.coverRow, height: layout.coverRow },
        copy: { flex: 1, gap: spacing.sm },
        head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        date: { flex: 1 },
        pressed: { opacity: opacity.pressed },
      }),
    [colors],
  );

  const date = new Date(session.startedAt).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={session.dayLabel + ' ' + date + ', ' + t(statusKey)}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <CoverImage
        seed={session.id}
        glyph={session.status === 'completed' ? 'trophy' : 'pulse'}
        radius="md"
        style={styles.cover}
      />
      <View style={styles.copy}>
        <View style={styles.head}>
          <Text variant="caption" tone="tertiary" style={styles.date}>
            {date}
          </Text>
          {session.status === 'completed' ? null : (
            <Badge
              label={t(statusKey)}
              tone={session.status === 'inProgress' ? 'warning' : 'danger'}
            />
          )}
        </View>
        <Text variant="title3" weight="bold" numberOfLines={1}>
          {session.dayLabel}
        </Text>
        <MetaChipRow>
          <MetaChip
            icon="clock"
            label={Math.round(session.durationSeconds / 60) + ' ' + t('minutesShort')}
          />
          <MetaChip icon="layers" label={session.setCount + ' ' + t('setsShort')} />
          <MetaChip
            icon="bolt"
            label={formatWeight(session.totalVolumeKg) + ' ' + t('kilogramsShort')}
          />
        </MetaChipRow>
      </View>
    </Pressable>
  );
}
