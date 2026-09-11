import { StyleSheet, View } from 'react-native';
import type { TrainingSession } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import { Button, HeroArtwork, MetricTile, Text } from '../../design/components';
import {
  formatCount,
  formatDuration,
  formatWorkoutVolume,
  formatWorkoutVolumeCompact,
} from '../../lib/format';
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
      {/* Hero de conclusão: momento de celebração, destaque total. O contexto
          `workout-completed` é o mesmo que a home usa logo depois do treino, o
          que faz as duas telas rimarem em vez de parecerem produtos diferentes. */}
      <HeroArtwork context="workout-completed" style={styles.hero}>
        <View style={styles.heroBody}>
          <Text tone="onAccent" variant="footnote" weight="semibold">
            {t('sessionFinished')}
          </Text>
          <Text tone="onAccent" variant="display" weight="bold">
            {formatWorkoutVolume(session.totalVolumeKg)} {t('kilogramsShort')}
          </Text>
          <Text tone="onAccent" variant="subhead">
            {t('sessionVolume')}
          </Text>
        </View>
      </HeroArtwork>
      <View style={styles.metrics}>
        <MetricTile
          label={t('sessionDuration')}
          value={formatDuration(session.durationSeconds)}
          accent="activity"
        />
        <MetricTile
          label={t('sessionRecords')}
          value={formatCount(sessionRecords(session, previous).length)}
          accent="strength"
        />
        <MetricTile
          label={t('sessionComparison')}
          value={
            delta === null
              ? t('sessionFirstHistory')
              : (delta > 0 ? '+' : delta < 0 ? '−' : '') +
                formatWorkoutVolumeCompact(Math.abs(delta)) +
                ' ' +
                t('kilogramsShort')
          }
          accent="energy"
        />
      </View>
      {queue.pending ? (
        <Text accessibilityLiveRegion="polite">
          {formatCount(queue.pending)}{' '}
          {plural(queue.pending, 'sessionPendingOne', 'sessionPending')}
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
