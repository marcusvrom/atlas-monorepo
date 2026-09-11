import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { t } from '../../i18n';
import { Button } from './Button';
import { Text } from './Text';
import { nextStep } from './numeric-step';
export function NumericStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const decrease = () => onChange(nextStep(value, -step, min, max));
  const increase = () => onChange(nextStep(value, step, min, max));
  return (
    <View style={styles.root}>
      <Text weight="medium">{label}</Text>
      <View style={styles.controls}>
        <Button
          variant="ghost"
          label={t('decrease')}
          onPress={decrease}
          disabled={disabled || value <= min}
        />
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value }}
          accessibilityState={{ disabled }}
          accessibilityActions={[
            { name: 'increment', label: t('increase') },
            { name: 'decrement', label: t('decrease') },
          ]}
          onAccessibilityAction={(event) => {
            if (!disabled) {
              if (event.nativeEvent.actionName === 'increment') increase();
              else if (event.nativeEvent.actionName === 'decrement') decrease();
            }
          }}
        >
          <Text variant="title2" weight="bold">
            {value.toLocaleString('pt-BR')}
          </Text>
        </View>
        <Button
          variant="ghost"
          label={t('increase')}
          onPress={increase}
          disabled={disabled || value >= max}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
