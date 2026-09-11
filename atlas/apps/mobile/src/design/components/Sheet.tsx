import { useAccessibilityPreferences } from '../accessibility';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion, radius, spacing } from '@atlas/design-tokens';
import { GlassSurface } from '../glass/GlassSurface';
import { useTheme } from '../theme-provider';
import { t } from '../../i18n';
import { Button } from './Button';
import { Text } from './Text';
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useAccessibilityPreferences().reduceMotion;
  const compact = height * 0.4;
  const offset = useSharedValue(compact);
  const origin = useSharedValue(compact);
  useEffect(() => {
    if (visible)
      scheduleOnUI(() => {
        'worklet';
        offset.set(compact);
      });
  }, [visible, compact, offset]);
  const move = (target: number) =>
    scheduleOnUI(() => {
      'worklet';
      offset.set(reduced ? target : withTiming(target, { duration: motion.duration.base }));
    });
  const pan = Gesture.Pan()
    .onBegin(() => {
      origin.set(offset.get());
    })
    .onUpdate((event) => {
      offset.set(Math.max(insets.top, Math.min(height, origin.get() + event.translationY)));
    })
    .onEnd(() => {
      if (offset.get() > height * 0.75) {
        scheduleOnRN(onClose);
        return;
      }
      const target = offset.get() < compact / 2 ? insets.top : compact;
      offset.set(reduced ? target : withTiming(target, { duration: motion.duration.base }));
    });
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        backdrop: {
          position: 'absolute',
          top: spacing.none,
          bottom: spacing.none,
          left: spacing.none,
          right: spacing.none,
          backgroundColor: colors.background,
        },
        panel: {
          position: 'absolute',
          top: spacing.none,
          bottom: spacing.none,
          left: spacing.none,
          right: spacing.none,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          backgroundColor: colors.surface,
          paddingBottom: insets.bottom + spacing.lg,
        },
        handle: { minHeight: spacing.xxxl, alignItems: 'center', justifyContent: 'center' },
        glass: { width: spacing.xxxl, height: spacing.sm },
        header: { paddingHorizontal: spacing.xl, gap: spacing.sm },
        controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
        body: {
          padding: spacing.xl,
          gap: spacing.lg,
          paddingBottom: compact + insets.bottom + spacing.xl,
        },
      }),
    [colors, compact, insets.bottom],
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('close')}
        />
        <Animated.View style={[styles.panel, animated]}>
          <GestureDetector gesture={pan}>
            <View style={styles.handle}>
              <GlassSurface style={styles.glass} />
            </View>
          </GestureDetector>
          <View style={styles.header}>
            <Text variant="title2" weight="bold">
              {title}
            </Text>
            <View style={styles.controls}>
              <Button variant="ghost" label={t('expand')} onPress={() => move(insets.top)} />
              <Button variant="ghost" label={t('collapse')} onPress={() => move(compact)} />
              <Button variant="ghost" label={t('close')} onPress={onClose} />
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
