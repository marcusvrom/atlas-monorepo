import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { spacing, radius } from '@atlas/design-tokens';
import { Button, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { GlassSurface } from '../../design/glass/GlassSurface';
import { t } from '../../i18n';

/**
 * ATL-SES-005 — controles da série.
 *
 * A composição anterior invertia a hierarquia: "Concluir treino" ficava no
 * centro da superfície, ladeado por duas setas sem rótulo, e a ação principal
 * vinha por baixo. Mas registrar uma série acontece ~20 vezes por treino e
 * concluir o treino acontece uma — a área e a posição tinham que refletir
 * isso.
 *
 * Agora o CTA vem primeiro e sozinho; a navegação entre exercícios fica abaixo,
 * rotulada (as setas nuas não diziam se navegavam entre séries ou exercícios);
 * e "Concluir treino" saiu daqui — mora no fim da tela, depois das séries
 * registradas, que é onde alguém procura por ele.
 */
export function SessionControls({
  onRecord,
  busy = false,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  onRecord: () => void;
  busy?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: { color: colors.textOnBrand },
        surface: { padding: spacing.md, gap: spacing.sm },
        nav: { flexDirection: 'row', gap: spacing.sm },
        navButton: { flex: 1 },
        primary: {
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('sessionRecord')}
        onPress={onRecord}
        disabled={busy}
        accessibilityState={{ disabled: busy, busy }}
        style={styles.primary}
      >
        <Text weight="bold" style={styles.label}>
          {t('sessionRecord')}
        </Text>
      </Pressable>
      <View style={styles.nav}>
        <Button
          variant="ghost"
          icon="back"
          label={t('sessionPreviousExercise')}
          disabled={busy || !canPrevious}
          onPress={onPrevious}
          style={styles.navButton}
        />
        <Button
          variant="ghost"
          icon="arrow"
          label={t('sessionNextExercise')}
          disabled={busy || !canNext}
          onPress={onNext}
          style={styles.navButton}
        />
      </View>
    </GlassSurface>
  );
}
