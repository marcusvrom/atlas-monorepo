import { AnatomyRegion } from './AnatomyRegion';
import { useAccessibilityPreferences } from '../design/accessibility';
import type { MuscleActivation, MuscleGroup, MuscleVolume } from '@atlas/contracts';
import { glass, layout, radius, motion, spacing } from '@atlas/design-tokens';
import { useEffect, useMemo, useState, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Button, Sheet, Text } from '../design/components';
import { useTheme } from '../design/theme-provider';
import { t } from '../i18n';
import { BODY_PATHS } from './body-paths';
import { AnatomyLegend } from './AnatomyLegend';
import { describeIntensity, intensityColor, intensityLevel } from './anatomy-scale';
export type AnatomicalView = 'anterior' | 'posterior';
export interface AnatomicalModelProps {
  interactive?: boolean;
  view: AnatomicalView;
  activations: Record<string, number>;
  muscleGroups: MuscleGroup[];
  onMusclePress?: (muscleCode: string) => void;
  width?: number;
  volumes?: MuscleVolume[];
  exerciseActivations?: MuscleActivation[];
  mode?: 'exercise' | 'volume_heatmap' | 'pain_map';
}
export function AnatomicalModel({
  interactive = true,
  view,
  activations,
  muscleGroups,
  onMusclePress,
  width = layout.anatomyWidth,
  volumes,
  exerciseActivations,
  mode = 'volume_heatmap',
}: AnatomicalModelProps) {
  const { colors } = useTheme();
  const shadeId = useId().replace(/:/g, '');
  const [selected, setSelected] = useState<string | null>(null);
  const [regions, setRegions] = useState(false);
  const reduced = useAccessibilityPreferences().reduceMotion;
  const rotation = useSharedValue(0);
  useEffect(() => {
    scheduleOnUI(() => {
      'worklet';
      rotation.set(
        reduced
          ? 0
          : withSequence(
              withTiming(90, { duration: motion.duration.fast }),
              withTiming(0, { duration: motion.duration.fast }),
            ),
      );
    });
  }, [view, reduced, rotation]);
  const animated = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: rotation.get() + 'deg' }],
  }));
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { gap: spacing.md },
        stage: {
          padding: spacing.lg,
          backgroundColor: colors.backgroundElevated,
          borderRadius: radius.lg,
        },
        model: { width, maxWidth: '100%', aspectRatio: 240 / 560, alignSelf: 'center' },
        regions: { gap: spacing.sm },
      }),
    [width, colors],
  );
  const visible = useMemo(
    () => muscleGroups.filter((g) => g.view === view || g.view === 'both'),
    [muscleGroups, view],
  );
  const pick = (code: string) => {
    if (interactive) setSelected(code);
    onMusclePress?.(code);
  };
  const label = (group: MuscleGroup) => {
    const value = activations[group.code] ?? 0;
    const volume = volumes?.find((v) => v.muscleCode === group.code);
    const role = exerciseActivations?.find((a) => a.muscleCode === group.code)?.role;
    const description =
      mode === 'exercise'
        ? role
          ? t(role)
          : t('anatomyInactive')
        : mode === 'pain_map'
          ? t('anatomyPain') + ' ' + Math.round(value * 10) + '/10'
          : describeIntensity(value);
    return (
      group.displayName +
      ': ' +
      description +
      (mode === 'volume_heatmap' ? ' · ' + intensityLevel(value) + '/3' : '') +
      (volume
        ? ' · ' + volume.weightedVolumeKg.toLocaleString('pt-BR') + ' ' + t('anatomyVolumeUnit')
        : '')
    );
  };
  const selectedGroup = muscleGroups.find((g) => g.code === selected);
  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.model, animated]}>
          <Svg viewBox="0 0 240 560" width="100%" height="100%">
            <Defs>
              <LinearGradient id={shadeId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.anatomyNeutral} />
                <Stop offset="0.5" stopColor={colors.borderStrong} />
                <Stop offset="1" stopColor={colors.anatomyNeutral} />
              </LinearGradient>
            </Defs>
            <Path
              d={BODY_PATHS.silhouette[view]}
              fill={'url(#' + shadeId + ')'}
              stroke={colors.borderStrong}
              strokeWidth={glass.borderWidth}
            />
            {visible.map((group) => {
              const role = exerciseActivations?.find((a) => a.muscleCode === group.code)?.role;
              const value =
                mode === 'exercise'
                  ? role === 'primary'
                    ? 1
                    : role === 'secondary'
                      ? 0.5
                      : 0
                  : (activations[group.code] ?? 0);
              return (
                <AnatomyRegion
                  key={group.svgPathId}
                  id={group.svgPathId}
                  d={BODY_PATHS.muscles[group.svgPathId] ?? ''}
                  fill={intensityColor(value, colors.anatomyNeutral)}
                  stroke={
                    selected === group.code || role === 'stabilizer'
                      ? colors.textPrimary
                      : colors.anatomyOutline
                  }
                  strokeWidth={
                    selected === group.code || role === 'stabilizer'
                      ? spacing.xxs
                      : glass.borderWidth
                  }
                  onPress={() => pick(group.code)}
                  label={label(group)}
                  selected={selected === group.code}
                />
              );
            })}
          </Svg>
        </Animated.View>
        <Text variant="caption" tone="secondary">
          {t('anatomyStylized')}
        </Text>
      </View>
      {mode === 'volume_heatmap' ? <AnatomyLegend /> : null}
      {selectedGroup ? <Text accessibilityLiveRegion="polite">{label(selectedGroup)}</Text> : null}
      <Button
        variant="ghost"
        label={t('anatomyRegions')}
        onPress={() => {
          if (interactive) setRegions(true);
          else onMusclePress?.('');
        }}
      />
      <Sheet visible={regions} title={t('anatomyRegions')} onClose={() => setRegions(false)}>
        <View style={styles.regions}>
          {visible.map((group) => (
            <Button
              key={group.code}
              variant="ghost"
              label={label(group)}
              onPress={() => pick(group.code)}
            />
          ))}
        </View>
      </Sheet>
    </View>
  );
}
