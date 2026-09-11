import { t } from '@/i18n';
import { useGlassCapability } from '@/design/glass/useGlassCapability';
import { useTheme } from '@/design/theme-provider';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

/**
 * Native Tabs entrega a tab bar de vidro DO SISTEMA no iOS 26 — não uma
 * imitação. É o único lugar do app onde o vidro não passa por <GlassSurface>,
 * porque quem renderiza é o próprio UIKit. Ver spec 11 §1.1.
 */
export default function TabsLayout() {
  const capability = useGlassCapability();
  const theme = useTheme();
  return (
    <NativeTabs
      tintColor={theme.colors.brand}
      backgroundColor={theme.colors.surface}
      blurEffect={capability === 'solid' ? 'none' : 'systemMaterial'}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="flame.fill" md="local_fire_department" />
        <NativeTabs.Trigger.Label>{t('today')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plans">
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="list_alt" />
        <NativeTabs.Trigger.Label>{t('plans')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Icon sf="chart.xyaxis.line" md="show_chart" />
        <NativeTabs.Trigger.Label>{t('progress')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="coach">
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        <NativeTabs.Trigger.Label>{t('coach')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
        <NativeTabs.Trigger.Label>{t('profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
