import { useRouter } from 'expo-router';
import { Card, EmptyState, Text } from '../../design/components';
import { t } from '../../i18n';
export function RehabilitationSection() {
  const router = useRouter();
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('rehabilitationTitle')}
      </Text>
      <EmptyState
        title={t('rehabilitationEmpty')}
        description={t('rehabilitationDescription')}
        actionLabel={t('coach')}
        onAction={() => router.push('/(tabs)/coach')}
      />
    </Card>
  );
}
