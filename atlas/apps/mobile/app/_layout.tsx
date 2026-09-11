import { AccessibilityProvider } from '@/design/accessibility';
import { OfflineSync } from '@/offline/OfflineSync';
import { OnboardingGate } from '@/features/onboarding/OnboardingGate';
import { Toast } from '@/design/components/Toast';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ThemedStatusBar } from '@/design/components/ThemedStatusBar';
import { DevMenuEntry } from '../src/dev/DevMenuEntry';
import { useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';
import { ApiProvider } from '@/data/api-provider';
import { createQueryClient } from '@/data/query-client';
import { ThemeProvider } from '@/design/theme-provider';
import { motion } from '@atlas/design-tokens';

// Telas fora de foco não re-renderizam. Crítico com 5 tabs vivas.
enableFreeze(true);

export default function RootLayout() {
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ApiProvider>
          <QueryClientProvider client={queryClient}>
            <AccessibilityProvider>
              <ThemeProvider>
                <ThemedStatusBar />
                {__DEV__ ? <DevMenuEntry /> : null}
                <Stack screenOptions={stackOptions}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Protected guard={__DEV__}>
                    <Stack.Screen name="dev" />
                    <Stack.Screen name="dev/design-system" />
                  </Stack.Protected>
                  <Stack.Screen name="session/[id]" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
                </Stack>
                <Toast />
                <OnboardingGate />
                <OfflineSync />
              </ThemeProvider>
            </AccessibilityProvider>
          </QueryClientProvider>
        </ApiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
// Empurra da direita com duração alinhada ao sistema; fundo transparente para
// que a aurora da próxima tela apareça durante a transição, sem flash preto.
const stackOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationDuration: motion.duration.base,
  contentStyle: { backgroundColor: 'transparent' },
} as const;
