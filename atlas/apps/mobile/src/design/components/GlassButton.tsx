import { useAccessibilityPreferences } from '../accessibility';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, spacing, glass } from '@atlas/design-tokens';
import { GlassSurface } from '../glass/GlassSurface';
import { useTheme } from '../theme-provider';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'neutral';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/**
 * Ação primária flutuante. A animação de pressão roda em worklet na UI thread —
 * nada de Animated da API antiga. Ver AGENTS.md, seção Convenções.
 */
export function GlassButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityHint,
}: GlassButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const reduced = useAccessibilityPreferences().reduceMotion;

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPressIn={() => {
        if (!reduced) scale.set(withSpring(0.96, motion.spring.snappy));
      }}
      onPressOut={() => {
        scale.set(reduced ? 1 : withSpring(1, motion.spring.snappy));
      }}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[animatedStyle, style, disabled && styles.disabled]}
    >
      <GlassSurface
        variant="regular"
        radius="pill"
        interactive
        {...(variant === 'primary' ? { tintColor: theme.colors.brand } : {})}
        style={styles.surface}
      >
        <Text
          variant="callout"
          weight="semibold"
          tone={variant === 'primary' ? 'primary' : 'secondary'}
        >
          {label}
        </Text>
      </GlassSurface>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    minHeight: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: glass.variant.clear.fallbackOpacity },
});
