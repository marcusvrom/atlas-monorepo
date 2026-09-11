import { useMemo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { motion, radius, spacing } from '@atlas/design-tokens';
import { useAccessibilityPreferences } from '../accessibility';
import { useTheme } from '../theme-provider';
import { Text } from './Text';

export function Button({
  label,
  onPress,
  variant = 'solid',
  disabled = false,
  busy = false,
  previewPressed = false,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  previewPressed?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const reduced = useAccessibilityPreferences().reduceMotion;
  // Escala de pressão em worklet na UI thread, no mesmo padrão do GlassButton.
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          minHeight: spacing.xxxl,
          minWidth: spacing.xxxl,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        solid: { backgroundColor: colors.brand },
        danger: { backgroundColor: colors.danger },
        ghost: { backgroundColor: colors.surface },
        pressed: { backgroundColor: colors.brandPressed },
        disabled: { backgroundColor: colors.backgroundElevated },
        label: { color: variant === 'ghost' ? colors.textPrimary : colors.textOnBrand },
        pressedLabel: { color: colors.textOnBrand },
        muted: { color: colors.textSecondary },
      }),
    [colors, variant],
  );
  const blocked = disabled || busy;
  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy }}
        disabled={blocked}
        onPressIn={() => {
          if (!reduced) scale.set(withSpring(0.97, motion.spring.snappy));
        }}
        onPressOut={() => {
          scale.set(reduced ? 1 : withSpring(1, motion.spring.snappy));
        }}
        onPress={() => {
          // Haptic leve só nas ações de peso (solid/danger); ghost fica silencioso.
          if (variant !== 'ghost') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.base,
          styles[variant],
          (pressed || previewPressed) && styles.pressed,
          blocked && styles.disabled,
        ]}
      >
        {({ pressed }) => (
          <Text
            weight="semibold"
            style={
              blocked
                ? styles.muted
                : pressed || previewPressed
                  ? styles.pressedLabel
                  : styles.label
            }
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
