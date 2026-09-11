import { Avatar } from '../avatar/Avatar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CurrentGoal, GoalType } from '@atlas/contracts';
import { useRouter } from 'expo-router';
import { layout, spacing, opacity } from '@atlas/design-tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  CoverImage,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { t } from '../../i18n';
import { useMe, useUpdateGoal } from './hooks';
export function ProfileScreen() {
  const me = useMe(),
    save = useUpdateGoal(),
    router = useRouter();
  if (me.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  if (me.isError)
    return (
      <Screen>
        <ErrorState message={t('profileError')} onRetry={() => void me.refetch()} />
      </Screen>
    );
  const profile = me.data;
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title={t('profile')} />
        {/* Hero do perfil: capa própria do usuário atrás do avatar. A semente é
            o id do perfil, então a cor é dele e não muda a cada sessão. */}
        <CoverImage seed={profile.id} glyph="none" radius="xl" style={styles.hero}>
          <CoverScrim />
          <View style={styles.heroBody}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('avatarEdit')}
                accessibilityHint={t('avatarTapHint')}
                onPress={() => router.push('/avatar/edit')}
                style={({ pressed }) => (pressed ? styles.avatarPressed : undefined)}
              >
                <Avatar config={profile.avatar} size={spacing.huge + spacing.lg} />
              </Pressable>
              <Text tone="onAccent" variant="title2" weight="bold">
                {profile.displayName}
              </Text>
              <Text tone="onAccent" variant="subhead">
                {profile.email}
              </Text>
              <View>
                <Badge label={t(profile.planKey)} tone="brand" />
              </View>
              <Text tone="onAccent" variant="footnote">
                {t('avatarTapHint')}
              </Text>
            </View>
            <Button label={t('avatarEdit')} onPress={() => router.push('/avatar/edit')} />
          </View>
        </CoverImage>
        <Card>
          <Text weight="bold">{t('currentGoal')}</Text>
          <View style={styles.options}>
            {GoalType.options.map((type) => (
              <Chip
                key={type}
                label={t(type)}
                selected={profile.goal?.type === type}
                disabled={save.isPending}
                onPress={() =>
                  save.mutate(
                    CurrentGoal.parse({
                      ...profile.goal,
                      type,
                      targetDate: profile.goal?.targetDate ?? null,
                      targetWeightKg: profile.goal?.targetWeightKg ?? null,
                      targetBodyFatPct: profile.goal?.targetBodyFatPct ?? null,
                      weeklySessionTarget: profile.goal?.weeklySessionTarget ?? 3,
                    }),
                  )
                }
              />
            ))}
          </View>
          {save.isError ? <ErrorState message={t('profileError')} /> : null}
        </Card>
        <Button label={t('plansCompare')} variant="ghost" onPress={() => router.push('/paywall')} />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: layout.pageInset, paddingBottom: spacing.huge * 2, gap: layout.sectionGap },
  // Sem altura fixa: o hero do perfil cresce com o conteúdo (nome longo,
  // e-mail longo) em vez de recortar a identidade do usuário.
  hero: {},
  heroBody: { padding: spacing.xl, gap: spacing.md },
  header: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.md },
  avatarPressed: { opacity: opacity.pressed },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
