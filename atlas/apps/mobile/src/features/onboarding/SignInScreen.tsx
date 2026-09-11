import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  CoverImage,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { t } from '../../i18n';
import { useMe, useSaveOnboarding } from './hooks';
import coachImage from '../../../assets/marketing/onboarding-coach.webp';
export function SignInScreen() {
  const router = useRouter();
  const me = useMe();
  const save = useSaveOnboarding();
  const start = () => {
    if (me.data)
      save.mutate(
        {
          step: 'profile',
          profile: {
            displayName: me.data.displayName,
            heightCm: me.data.heightCm,
            birthDate: me.data.birthDate,
            biologicalSex: me.data.biologicalSex,
            activityLevel: me.data.activityLevel,
          },
          goal: me.data.goal,
          baseline: null,
        },
        { onSuccess: () => router.replace('/(auth)/onboarding') },
      );
  };
  return (
    <Screen>
      <View style={styles.content}>
        {/* Mesma semente da última página de boas-vindas: a tela de entrada
            continua a capa que o usuário acabou de ver, em vez de cortar. */}
        <CoverImage
          seed="onboarding-coach"
          asset={coachImage}
          glyph="rings"
          radius="xxl"
          style={styles.hero}
        >
          <CoverScrim />
          <View style={styles.heroBody}>
            <Text tone="onAccent" variant="display" weight="bold">
              {t('signInTitle')}
            </Text>
            <Text tone="onAccent" variant="subhead">
              {t('signInMock')}
            </Text>
          </View>
        </CoverImage>
        {me.isPending ? (
          <LoadingState />
        ) : me.isError ? (
          <ErrorState message={t('onboardingNetworkError')} onRetry={() => void me.refetch()} />
        ) : (
          <>
            <Button label={t('signInApple')} onPress={start} busy={save.isPending} />
            <Button label={t('signInGoogle')} onPress={start} busy={save.isPending} />
            <Button label={t('signInEmail')} onPress={start} busy={save.isPending} />
          </>
        )}
        {save.isError ? <ErrorState message={t('onboardingNetworkError')} /> : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.xs },
});
