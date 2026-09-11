import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DemoOption } from './DemoOption';
import { t } from '../i18n';
import { useTheme } from '../design/theme-provider';
export function DevMenuEntry() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(
    () => StyleSheet.create({ root: { backgroundColor: theme.colors.surface } }),
    [theme],
  );
  if (!__DEV__) return null;
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <DemoOption label={t('devOpen')} onPress={() => router.push('/dev')} />
    </SafeAreaView>
  );
}
