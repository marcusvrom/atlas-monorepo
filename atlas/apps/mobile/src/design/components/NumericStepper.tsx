import { formatCount, formatWeight } from '../../lib/format';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { layout, opacity, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { t } from '../../i18n';
import { Icon } from './Icon';
import { Text } from './Text';
import { nextStep } from './numeric-step';

/** ATL-UI-012 — native adjustable control; individually labelled buttons on web. */
export function NumericStepper({
  label,
  testID,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  disabled = false,
}: {
  label: string;
  testID?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Sufixo exibido junto ao valor ("kg", "s"). Não entra na conta. */
  unit?: string;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const atMin = disabled || value <= min;
  const atMax = disabled || value >= max;

  const apply = (delta: number) => {
    const next = nextStep(value, delta, min, max);
    if (next === value) return;
    // Feedback tátil: o usuário ajusta carga sem olhar para a tela entre uma
    // série e outra. Sem o toque, ele não sabe se o toque pegou.
    void Haptics.selectionAsync();
    onChange(next);
  };

  const decrease = () => apply(-step);
  const increase = () => apply(step);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        label: { flex: 1 },
        controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
        button: {
          width: layout.controlSize,
          height: layout.controlSize,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.backgroundElevated,
        },
        pressed: { opacity: opacity.pressed },
        // Largura fixa: ver nota em `layout.stepperValue`.
        value: {
          minWidth: layout.stepperValue,
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: spacing.xxs,
        },
      }),
    [colors],
  );

  return (
    <View
      style={styles.root}
      accessible={Platform.OS !== 'web'}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'adjustable'}
      accessibilityLabel={unit ? label + ', ' + unit : label}
      accessibilityValue={{
        min,
        max,
        now: value,
        text:
          (unit === t('unitKg') ? formatWeight(value) : String(value)) + (unit ? ' ' + unit : ''),
      }}
      accessibilityState={{ disabled }}
      accessibilityActions={[
        { name: 'increment', label: t('increase') },
        { name: 'decrement', label: t('decrease') },
      ]}
      onAccessibilityAction={(event) => {
        if (disabled) return;
        if (event.nativeEvent.actionName === 'increment') increase();
        else if (event.nativeEvent.actionName === 'decrement') decrease();
      }}
    >
      <Text weight="medium" style={styles.label}>
        {label}
      </Text>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessible={Platform.OS === 'web'}
          testID={testID ? testID + '-decrease' : undefined}
          accessibilityLabel={t('decrease') + ' ' + label}
          accessibilityState={{ disabled: atMin }}
          disabled={atMin}
          onPress={decrease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Icon name="minus" color={atMin ? colors.textTertiary : colors.textPrimary} />
        </Pressable>
        <View style={styles.value}>
          <Text variant="title2" weight="bold">
            {unit === t('unitKg') ? formatWeight(value) : formatCount(value)}
          </Text>
          {unit ? (
            <Text variant="footnote" tone="tertiary">
              {unit}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessible={Platform.OS === 'web'}
          testID={testID ? testID + '-increase' : undefined}
          accessibilityLabel={t('increase') + ' ' + label}
          accessibilityState={{ disabled: atMax }}
          disabled={atMax}
          onPress={increase}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Icon name="plus" color={atMax ? colors.textTertiary : colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
