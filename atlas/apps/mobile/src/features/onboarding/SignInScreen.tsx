import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  ErrorState,
  GradientSurface,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useMe, useSaveOnboarding } from './hooks';
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
        <GradientSurface name="slate" radius="xxl" level="lg" style={styles.hero}>
          <Text tone="onAccent" variant="display" weight="bold">
            {t('signInTitle')}
          </Text>
          <Text tone="onAccent" variant="subhead">
            {t('signInMock')}
          </Text>
        </GradientSurface>
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
  hero: { gap: spacing.sm, alignItems: 'flex-start' },
});
