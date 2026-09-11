import { useAccessibilityPreferences } from '../../design/accessibility';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { motion, spacing } from '@atlas/design-tokens';
import type { ExercisePrescription } from '@atlas/contracts';
import { Button, Card, Text } from '../../design/components';
import { t } from '../../i18n';
export function PlanExerciseRow({
  exercise,
  index,
  count,
  onMove,
  onRemove,
  onEdit,
}: {
  exercise: ExercisePrescription;
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const y = useSharedValue(0),
    x = useSharedValue(0);
  const reduced = useAccessibilityPreferences().reduceMotion;
  const [height, setHeight] = useState(spacing.huge * 3);
  const reset = () => {
    'worklet';
    x.set(reduced ? 0 : withTiming(0, { duration: motion.duration.fast }));
    y.set(reduced ? 0 : withTiming(0, { duration: motion.duration.fast }));
  };
  const drag = Gesture.Pan()
    .activateAfterLongPress(motion.duration.slow)
    .onUpdate((e) => y.set(e.translationY))
    .onEnd(() => {
      scheduleOnRN(onMove, Math.max(0, Math.min(count - 1, index + Math.round(y.get() / height))));
      reset();
    })
    .onFinalize(reset);
  const swipe = Gesture.Pan()
    .activeOffsetX([-spacing.xl, spacing.xl])
    .failOffsetY([-spacing.md, spacing.md])
    .onUpdate((e) => x.set(Math.min(0, e.translationX)))
    .onEnd(() => {
      if (x.get() < -spacing.huge) scheduleOnRN(onRemove);
      reset();
    })
    .onFinalize(reset);
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }, { translateX: x.get() }],
    zIndex: y.get() === 0 ? 0 : 1,
  }));
  return (
    <GestureDetector gesture={Gesture.Race(drag, swipe)}>
      <Animated.View
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={[styles.root, animated]}
      >
        <Card>
          <Text weight="bold">
            {exercise.order}. {exercise.exerciseName}
          </Text>
          <Text>
            {exercise.sets.length} {t('planSets')} ·{' '}
            {t(
              exercise.technique === 'superset'
                ? 'techniqueSuperset'
                : exercise.technique === 'dropset'
                  ? 'techniqueDropset'
                  : 'techniqueStraight',
            )}
          </Text>
          <Text variant="caption">{t('planGestureHint')}</Text>
          <View style={styles.actions}>
            <Button label={t('edit')} variant="ghost" onPress={onEdit} />
            <Button
              label={t('moveUp')}
              disabled={index === 0}
              variant="ghost"
              onPress={() => onMove(index - 1)}
            />
            <Button
              label={t('moveDown')}
              disabled={index === count - 1}
              variant="ghost"
              onPress={() => onMove(index + 1)}
            />
            <Button label={t('remove')} variant="danger" onPress={onRemove} />
          </View>
        </Card>
      </Animated.View>
    </GestureDetector>
  );
}
const styles = StyleSheet.create({
  root: { paddingVertical: spacing.sm },
  actions: { gap: spacing.sm, flexDirection: 'row', flexWrap: 'wrap' },
});
