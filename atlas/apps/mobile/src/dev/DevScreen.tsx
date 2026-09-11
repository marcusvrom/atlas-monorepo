import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { spacing, radius, typography } from '@atlas/design-tokens';
import { Card, Screen, Text } from '../design/components';
import { GlassSurface } from '../design/glass/GlassSurface';
import { useTheme } from '../design/theme-provider';
import { t } from '../i18n';
import { DemoOption } from './DemoOption';
import { updateDemoSettings, useDemoSettings } from './demo-settings';

export function DevScreen() {
  const router = useRouter();
  const cache = useQueryClient();
  const settings = useDemoSettings();
  const theme = useTheme();
  const [latency, setLatency] = useState(String(settings.latencyMs));
  const [errorRate, setErrorRate] = useState(String(settings.errorRate));
  const [invalid, setInvalid] = useState(false);
  const themed = useMemo(
    () =>
      StyleSheet.create({
        input: { color: theme.colors.textPrimary, backgroundColor: theme.colors.surface },
      }),
    [theme],
  );
  const apply = () => {
    const delay = Number(latency.trim().replace(',', '.'));
    const rate = Number(errorRate.trim().replace(',', '.'));
    const valid =
      latency.trim() !== '' &&
      errorRate.trim() !== '' &&
      Number.isFinite(delay) &&
      delay >= 0 &&
      delay <= 30000 &&
      Number.isFinite(rate) &&
      rate >= 0 &&
      rate <= 1;
    setInvalid(!valid);
    if (valid) updateDemoSettings({ latencyMs: delay, errorRate: rate });
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" weight="bold">
          {t('devTitle')}
        </Text>
        <DemoOption label={t('back')} onPress={() => router.back()} />
        <DemoOption label={t('designSystem')} onPress={() => router.push('/dev/design-system')} />
        <Card>
          <Text weight="bold">{t('accessibilityTitle')}</Text>
          {(['highContrast', 'reduceTransparency', 'reduceMotion'] as const).map((key) => (
            <DemoOption
              key={key}
              label={t(key)}
              selected={settings[key]}
              onPress={() => updateDemoSettings({ [key]: !settings[key] })}
            />
          ))}
          <Text weight="bold">{t('demoPlan')}</Text>
          {(['free', 'pro'] as const).map((plan) => (
            <DemoOption
              key={plan}
              label={t(plan)}
              selected={settings.plan === plan}
              onPress={() => {
                updateDemoSettings({ plan });
                void cache.invalidateQueries({ queryKey: ['me'] });
              }}
            />
          ))}
          <Text weight="bold">{t('demoRole')}</Text>
          {(['athlete', 'professional'] as const).map((role) => (
            <DemoOption
              key={role}
              label={t(role)}
              selected={settings.role === role}
              onPress={() => {
                updateDemoSettings({ role });
                void cache.invalidateQueries({ queryKey: ['me'] });
              }}
            />
          ))}
          <DemoOption
            label={t('demoClients60')}
            selected={settings.clientCount === 60}
            onPress={() => {
              updateDemoSettings({ clientCount: settings.clientCount === 60 ? 24 : 60 });
              void cache.invalidateQueries({ queryKey: ['coaching'] });
            }}
          />
          <Text weight="bold">{t('theme')}</Text>
          <DemoOption
            label={t('dark')}
            selected={settings.theme === 'dark'}
            onPress={() => updateDemoSettings({ theme: 'dark' })}
          />
          <DemoOption
            label={t('light')}
            selected={settings.theme === 'light'}
            onPress={() => updateDemoSettings({ theme: 'light' })}
          />
        </Card>
        <Card>
          <Text weight="bold">{t('glass')}</Text>
          <DemoOption
            label={t('native')}
            selected={settings.capability === 'native'}
            onPress={() => updateDemoSettings({ capability: 'native' })}
          />
          <DemoOption
            label={t('blurFallback')}
            selected={settings.capability === 'blurFallback'}
            onPress={() => updateDemoSettings({ capability: 'blurFallback' })}
          />
          <DemoOption
            label={t('solid')}
            selected={settings.capability === 'solid'}
            onPress={() => updateDemoSettings({ capability: 'solid' })}
          />
        </Card>
        <Text>{t('latency')}</Text>
        <TextInput
          accessibilityLabel={t('latency')}
          keyboardType="numeric"
          value={latency}
          onChangeText={setLatency}
          style={[styles.input, themed.input]}
        />
        <Text>{t('errorRate')}</Text>
        <TextInput
          accessibilityLabel={t('errorRate')}
          keyboardType="decimal-pad"
          value={errorRate}
          onChangeText={setErrorRate}
          style={[styles.input, themed.input]}
        />
        {invalid ? (
          <Text accessibilityRole="alert" tone="danger">
            {t('invalid')}
          </Text>
        ) : null}
        <DemoOption label={t('apply')} onPress={apply} />
      </ScrollView>
      <GlassSurface style={styles.preview}>
        <Text>{t('preview')}</Text>
      </GlassSurface>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.huge + spacing.xxxl },
  input: {
    minHeight: spacing.xxxl,
    padding: spacing.md,
    borderRadius: radius.md,
    fontSize: typography.size.body,
  },
  preview: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.lg,
  },
});
