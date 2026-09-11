import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { spacing, typography } from '@atlas/design-tokens';
import { Icon } from '@/design/components/Icon';
import { useTheme } from '@/design/theme-provider';
import { t } from '@/i18n';
/** ATL-UI-001: navegação da prévia web. iOS/Android continuam com NativeTabs. */
export default function WebTabsLayout() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        bar: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: spacing.huge + spacing.sm,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        label: { fontSize: typography.size.caption, fontWeight: typography.weight.medium },
        scene: { backgroundColor: colors.background },
      }),
    [colors],
  );
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('today'),
          tabBarIcon: ({ color }) => <Icon name="dumbbell" color={color} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: t('plans'),
          tabBarIcon: ({ color }) => <Icon name="check" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('progress'),
          tabBarIcon: ({ color }) => <Icon name="chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: t('coach'),
          tabBarIcon: ({ color }) => <Icon name="person" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <Icon name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
