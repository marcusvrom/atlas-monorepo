import { formatWeight } from '../../lib/format-weight';
import { StyleSheet, View } from 'react-native';
import type { TrainingSession } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import { Button, CoverImage, MetricTile, Text } from '../../design/components';
import { CoverScrim } from '../../design/media';
import { plural, t } from '../../i18n';
import { sessionRecords } from './session-summary';
import { useSessionQueue } from './hooks';
export function SessionSummary({
  session,
  previous,
  onClose,
}: {
  session: TrainingSession;
  previous: TrainingSession | null;
  onClose: () => void;
}) {
  const queue = useSessionQueue(session.id);
  const delta = previous ? session.totalVolumeKg - previous.totalVolumeKg : null;
  return (
    <View style={styles.root}>
      {/* Hero de conclusão: momento de celebração, destaque total. A capa é
          semeada pela própria sessão, então cada treino concluído tem a sua —
          duas sessões seguidas não se parecem, e a tela não vira um carimbo. */}
      <CoverImage seed={session.id} glyph="trophy" radius="xxl" style={styles.hero}>
        <CoverScrim />
        <View style={styles.heroBody}>
          <Text tone="onAccent" variant="footnote" weight="semibold">
            {t('sessionFinished')}
          </Text>
          <Text tone="onAccent" variant="display" weight="bold">
            {formatWeight(session.totalVolumeKg)} kg
          </Text>
          <Text tone="onAccent" variant="subhead">
            {t('sessionVolume')}
          </Text>
        </View>
      </CoverImage>
      <View style={styles.metrics}>
        <MetricTile
          label={t('sessionDuration')}
          value={Math.round(session.durationSeconds / 60) + ' min'}
          accent="activity"
        />
        <MetricTile
          label={t('sessionRecords')}
          value={String(sessionRecords(session, previous).length)}
          accent="strength"
        />
        <MetricTile
          label={t('sessionComparison')}
          value={delta === null ? t('sessionFirstHistory') : formatWeight(delta) + ' kg'}
          accent="energy"
        />
      </View>
      {queue.pending ? (
        <Text accessibilityLiveRegion="polite">
          {queue.pending} {plural(queue.pending, 'sessionPendingOne', 'sessionPending')}
        </Text>
      ) : null}
      <Button label={t('sessionExit')} onPress={onClose} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.lg },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.xs },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
