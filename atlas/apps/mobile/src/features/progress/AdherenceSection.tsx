import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Card, ErrorState, LoadingState, ProgressRing, Text } from '../../design/components';
import { plural, t } from '../../i18n';
import { useAdherence } from './hooks';
export function AdherenceSection({ days = 30 }: { days?: 7 | 30 | 90 }) {
  const query = useAdherence(days);
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('adherenceTitle')}
      </Text>
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState message={t('progressError')} onRetry={() => void query.refetch()} />
      ) : (
        <View style={styles.center}>
          <ProgressRing value={query.data.rate} label={t('adherenceTitle')} accent="activity" />
          <Text tone="secondary">
            {query.data.completedSessions} / {query.data.plannedSessions}{' '}
            {plural(query.data.plannedSessions, 'completedSessionsOne', 'completedSessions')}
          </Text>
        </View>
      )}
    </Card>
  );
}
const styles = StyleSheet.create({ center: { alignItems: 'center', gap: spacing.md } });
