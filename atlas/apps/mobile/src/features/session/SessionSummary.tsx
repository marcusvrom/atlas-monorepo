import { StyleSheet, View } from 'react-native';
import type { TrainingSession } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import { Button, HeroArtwork, MetricTile, Text } from '../../design/components';
import { formatCount, formatDuration, formatTonnage } from '../../lib/format';
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
          {/* O número de celebração passou a ser o tempo treinado, não a
              tonelagem: "55 min" é uma conquista que a pessoa reconhece na hora,
              enquanto "17.548 kg" precisava de uma aula antes de virar orgulho.
              A carga continua logo abaixo, com nome. */}
          <Text tone="onAccent" variant="display" weight="bold">
            {formatDuration(session.durationSeconds)}
          </Text>
          <Text tone="onAccent" variant="subhead">
            {t('sessionDurationTrained')}
          </Text>
        </View>
      </HeroArtwork>
      <View style={styles.metrics}>
        <MetricTile
          label={t('sessionVolume')}
          value={formatTonnage(session.totalVolumeKg)}
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
              : (delta > 0 ? '+' : delta < 0 ? '−' : '') + formatTonnage(Math.abs(delta))
          }
          accent="energy"
        />
      </View>
      <Text variant="caption" tone="tertiary">
        {t('tonnageExplained')}
      </Text>
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
