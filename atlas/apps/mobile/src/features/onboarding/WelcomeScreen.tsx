import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Button, ProgressRing, Screen, Text } from '../../design/components';
import { t } from '../../i18n';
export function WelcomeScreen() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const title =
    page === 0
      ? t('welcomeTitle')
      : page === 1
        ? t('welcomeProgressTitle')
        : t('welcomeCoachTitle');
  return (
    <Screen>
      <View style={styles.content}>
        <ProgressRing
          value={(page + 1) / 3}
          label={title}
          accent={page === 0 ? 'activity' : page === 1 ? 'strength' : 'primary'}
        />
        <Text variant="title1" weight="bold">
          {title}
        </Text>
        <Text>
          {page === 0
            ? t('welcomeBody')
            : page === 1
              ? t('welcomeProgressBody')
              : t('welcomeCoachBody')}
        </Text>
        <Button
          label={page === 2 ? t('start') : t('next')}
          onPress={() => (page === 2 ? router.push('/(auth)/sign-in') : setPage(page + 1))}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl, gap: spacing.xl, justifyContent: 'center' },
});
