import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserId } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { Alert, StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  HeroArtwork,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useProfessional } from './hooks';
export function ProfessionalScreen() {
  const params = useLocalSearchParams<{ id: string }>(),
    router = useRouter();
  const parsed = UserId.safeParse(params.id);
  const query = useProfessional(parsed.success ? parsed.data : undefined);
  if (!parsed.success)
    return (
      <Screen>
        <ErrorState message={t('coachError')} />
      </Screen>
    );
  if (query.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (!query.data)
    return (
      <Screen>
        <ErrorState message={t('coachError')} onRetry={() => void query.refetch()} />
      </Screen>
    );
  const professional = query.data;
  return (
    <Screen>
      <FlashList
        data={professional.reviews}
        keyExtractor={(review) => review.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
            {/* A mesma arte do acompanhamento profissional que aparece no
                login e no card de coach: o contexto `coach-highlight` amarra as
                três telas à ideia de "alguém do seu lado". */}
            <HeroArtwork context="coach-highlight" style={styles.hero}>
              <View style={styles.heroBody}>
                <View style={styles.heroTop}>
                  <Text tone="onAccent" variant="title1" weight="bold" style={styles.heroName}>
                    {professional.displayName}
                  </Text>
                  {professional.acceptingClients ? (
                    <Badge label={t('professionalOpen')} tone="success" />
                  ) : null}
                </View>
                <Text tone="onAccent" weight="bold" variant="subhead">
                  {professional.credentialLabel}
                </Text>
                <Text tone="onAccent" variant="subhead" numberOfLines={2}>
                  {professional.specialties.map((specialty) => t(specialty)).join(' · ')}
                </Text>
              </View>
            </HeroArtwork>
            <Text>{professional.bio}</Text>
            <Text weight="bold">{t('cancellationPolicy')}</Text>
            <Text>{professional.cancellationPolicy}</Text>
            <Button
              label={t('hireDemo')}
              disabled={!professional.acceptingClients}
              onPress={() => Alert.alert(t('hireDemo'), t('hireDemoDescription'))}
            />
            <Text variant="title2">{t('reviews')}</Text>
          </View>
        }
        ListEmptyComponent={<Text>{t('reviewsEmpty')}</Text>}
        renderItem={({ item }) => (
          <View style={styles.review}>
            <Card>
              <Text weight="bold">
                {item.displayName} · {item.rating}/5
              </Text>
              <Text>{item.comment}</Text>
            </Card>
          </View>
        )}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { gap: spacing.md },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.xs },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroName: { flex: 1 },
  review: { paddingTop: spacing.md },
});
