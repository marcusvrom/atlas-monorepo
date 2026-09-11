import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { spacing, radius, glass } from '@atlas/design-tokens';
import { Text, Icon } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import type { calendarWeek } from './dashboard-math';
import { t } from '../../i18n';
export function CalendarDay({
  day,
  onPress,
}: {
  day: ReturnType<typeof calendarWeek>[number];
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: spacing.xxxl + spacing.sm,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          alignItems: 'center',
          borderRadius: radius.md,
          borderWidth: glass.borderWidth,
          borderColor: day.isToday ? colors.brand : colors.border,
          backgroundColor: day.sessions.length ? colors.surfacePressed : colors.surface,
        },
        dot: { color: day.sessions.length ? colors.brand : colors.textTertiary },
      }),
    [colors, day.isToday, day.sessions.length],
  );
  return (
    <Pressable
      style={styles.root}
      accessibilityRole="button"
      accessibilityLabel={
        day.date.toLocaleDateString('pt-BR') +
        ', ' +
        day.sessions.length +
        ' ' +
        t('dashboardSessions')
      }
      onPress={onPress}
    >
      <Text variant="caption" tone="secondary">
        {day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase()}
      </Text>
      <Text weight="bold">{day.date.getDate()}</Text>
      {day.sessions.length ? (
        <Icon name="check" color={colors.brand} />
      ) : (
        <Text tone="tertiary">—</Text>
      )}
    </Pressable>
  );
}
