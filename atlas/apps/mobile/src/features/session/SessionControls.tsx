import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius } from '@atlas/design-tokens';
import { Button, IconButton, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { GlassSurface } from '../../design/glass/GlassSurface';
import { t } from '../../i18n';
export function SessionControls({
  onRecord,
  onPrevious,
  onNext,
  onFinish,
}: {
  onRecord: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { color: colors.textOnBrand },
        surface: { padding: spacing.md, gap: spacing.sm },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        },
        finish: { flex: 1 },
        primary: {
          minWidth: spacing.huge,
          minHeight: spacing.huge,
          padding: spacing.lg,
          borderRadius: radius.pill,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors],
  );
  return (
    <GlassSurface variant="regular" radius="xl" style={styles.surface}>
      <View style={styles.row}>
        <IconButton icon="back" label={t('previous')} onPress={onPrevious} />
        <Button style={styles.finish} label={t('finish')} variant="ghost" onPress={onFinish} />
        <IconButton icon="arrow" label={t('next')} onPress={onNext} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sessionRecord')}
        onPress={onRecord}
        style={styles.primary}
      >
        <Text weight="bold" style={styles.label}>
          {t('sessionRecord')}
        </Text>
      </Pressable>
    </GlassSurface>
  );
}
