import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feature } from '@atlas/contracts';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Badge, Button, Card, GradientSurface, Screen, Text } from '../../design/components';
import { usePaywallEvent } from '../../data/queries/paywall';
import { t } from '../../i18n';
export function PaywallScreen() {
  const params = useLocalSearchParams<{ feature?: string }>(),
    router = useRouter();
  const parsed = Feature.safeParse(params.feature);
  const feature = parsed.success ? parsed.data : 'advancedInsights';
  usePaywallEvent(feature);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero da feature bloqueada: foco no benefício. */}
        <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
          <Badge label={t('pro')} tone="brand" />
          <Text tone="onAccent" variant="display" weight="bold">
            {t(feature)}
          </Text>
          <Text tone="onAccent" variant="subhead">
            {t((feature + 'Description') as Parameters<typeof t>[0])}
          </Text>
        </GradientSurface>
        <Text tone="secondary">{t('paywallNoTransaction')}</Text>
        <View style={styles.plans}>
          <Card>
            <Text variant="title2" weight="bold">
              {t('free')}
            </Text>
            <Text tone="secondary">{t('freeComparison')}</Text>
          </Card>
          {/* Plano recomendado: superfície escura glossy + selo (texto de corpo
              longo exige contraste alto, por isso slate e não o gradiente vibrante). */}
          <GradientSurface name="slate" radius="xl" level="md" style={styles.proCard}>
            <View style={styles.proHead}>
              <Text tone="onAccent" variant="title2" weight="bold">
                {t('pro')}
              </Text>
              <Badge label={t('recommended')} tone="brand" />
            </View>
            <Text tone="onAccent" variant="subhead">
              {t('proComparison')}
            </Text>
          </GradientSurface>
        </View>
        <Button
          label={t('proLearn')}
          onPress={() => Alert.alert(t('pro'), t('paywallNoTransaction'))}
        />
        <Button label={t('notNow')} variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg },
  hero: { gap: spacing.sm, alignItems: 'flex-start' },
  plans: { gap: spacing.md },
  proCard: { gap: spacing.sm },
  proHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
