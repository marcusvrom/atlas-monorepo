import { useRouter } from 'expo-router';
import { Button, Card, EmptyState, ErrorState, LoadingState, Text } from '../../design/components';
import { t } from '../../i18n';
import { useMetricSeries, useEntitlement } from './hooks';
import { MetricChart } from './MetricChart';
export function CompositionSection({ days = 90 }: { days?: 7 | 30 | 90 }) {
  const router = useRouter();
  const weight = useMetricSeries('weight', days),
    lean = useMetricSeries('leanMass', days);
  const entitlement = useEntitlement('bodyCompositionTracking');
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('compositionTitle')}
      </Text>
      {weight.isPending ? (
        <LoadingState />
      ) : weight.isError ? (
        <ErrorState message={t('progressError')} onRetry={() => void weight.refetch()} />
      ) : weight.data.points.length ? (
        <MetricChart series={weight.data} label={t('weight')} />
      ) : (
        <EmptyState
          title={t('measurementEmpty')}
          description={t('measurementEmptyDescription')}
          actionLabel={t('measurementAdd')}
          onAction={() => router.push('/measurement/new')}
        />
      )}
      <Text>{t('leanMassExplanation')}</Text>
      {entitlement.allowed ? (
        lean.isPending ? (
          <LoadingState />
        ) : lean.isError ? (
          <ErrorState message={t('progressError')} onRetry={() => void lean.refetch()} />
        ) : lean.data.points.length ? (
          <MetricChart series={lean.data} label={t('leanMassLabel')} />
        ) : (
          <Text>{t('leanMassEmpty')}</Text>
        )
      ) : (
        <Button
          label={t('compositionUnlock')}
          onPress={() =>
            router.push({ pathname: '/paywall', params: { feature: 'bodyCompositionTracking' } })
          }
        />
      )}
      <Button
        label={t('measurementAdd')}
        variant="ghost"
        onPress={() => router.push('/measurement/new')}
      />
    </Card>
  );
}
