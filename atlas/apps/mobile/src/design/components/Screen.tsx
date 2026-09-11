import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, motion, spacing } from '@atlas/design-tokens';
import { useAccessibilityPreferences } from '../accessibility';
import { DepthBackground } from './DepthBackground';

/**
 * Casca de toda tela: aplica o fundo de profundidade e as safe areas.
 * O conteúdo entra com um fade curto para suavizar a troca de telas — nunca
 * um "corte seco". Desligado com "Reduzir movimento". Ver spec 11 §1.2.
 */
export function Screen({
  children,
  edges = ['top'],
}: {
  children: ReactNode;
  edges?: ('top' | 'bottom')[];
}) {
  const insets = useSafeAreaInsets();
  const reduced = useAccessibilityPreferences().reduceMotion;
  const top = edges.includes('top') ? insets.top : spacing.none;
  const bottom = edges.includes('bottom') ? insets.bottom : spacing.none;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        content: { flex: 1, width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingTop: top, paddingBottom: bottom },
      }),
    [top, bottom],
  );
  return (
    <View style={styles.root}>
      <DepthBackground />
      <Animated.View
        style={styles.content}
        entering={reduced ? undefined : FadeIn.duration(motion.duration.base)}
      >
        {children}
      </Animated.View>
    </View>
  );
}
