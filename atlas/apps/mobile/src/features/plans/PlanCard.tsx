import type { WorkoutPlanSummary } from '@atlas/contracts';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, opacity } from '@atlas/design-tokens';
import { Badge, Card, Icon, Text } from '../../design/components';
import { t } from '../../i18n';
export function PlanCard({ plan, onPress }: { plan: WorkoutPlanSummary; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={plan.name}
      accessibilityHint={t('planOpenHint')}
      onPress={onPress}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <Card>
        <View style={styles.row}>
          <Icon name="dumbbell" />
          {plan.isActive ? <Badge label={t('planActive')} tone="success" /> : null}
        </View>
        <Text variant="title2" weight="bold">
          {plan.name}
        </Text>
        <View style={styles.row}>
          <Text variant="subhead" tone="secondary" style={styles.meta}>
            {plan.dayCount} {t('planDays')} · {t('version')} {plan.version}
          </Text>
          <Icon name="arrow" />
        </View>
      </Card>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  root: { paddingBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: { flex: 1 },
  pressed: { opacity: opacity.pressed },
});
