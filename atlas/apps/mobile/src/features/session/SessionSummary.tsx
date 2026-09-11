import { StyleSheet, View } from 'react-native';
import type { TrainingSession } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Button, GradientSurface, MetricTile, Text } from '../../design/components';
import { t } from '../../i18n';
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
      {/* Hero de conclusão: momento de celebração, destaque total. */}
      <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
        <Text tone="onAccent" variant="footnote" weight="semibold">
          {t('sessionFinished')}
        </Text>
        <Text tone="onAccent" variant="display" weight="bold">
          {session.totalVolumeKg.toLocaleString('pt-BR')} kg
        </Text>
        <Text tone="onAccent" variant="subhead">
          {t('sessionVolume')}
        </Text>
      </GradientSurface>
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
          value={delta === null ? t('sessionFirstHistory') : delta.toLocaleString('pt-BR') + ' kg'}
          accent="energy"
        />
      </View>
      {queue.pending ? (
        <Text accessibilityLiveRegion="polite">
          {queue.pending} {t('sessionPending')}
        </Text>
      ) : null}
      <Button label={t('sessionExit')} onPress={onClose} />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.lg },
  hero: { gap: spacing.xs, alignItems: 'flex-start' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
