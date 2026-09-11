import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { layout, opacity, radius, spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { t } from '../../i18n';
import { Icon } from './Icon';
import { Text } from './Text';
import { nextStep } from './numeric-step';

/**
 * ATL-SES-005 — stepper como par de botões redondos.
 *
 * A versão anterior usava dois botões de texto ("Diminuir" / "Aumentar") de
 * largura livre. Funcionava, mas custava ~140 pt de altura por campo: na tela
 * de sessão, três campos ocupavam mais de metade do viewport só para ajustar
 * três números. Pior, a palavra "Diminuir" não é mais legível que um `−` — ela
 * é apenas maior.
 *
 * Agora: rótulo à esquerda, cluster de controle à direita, 44 pt de alvo de
 * toque em cada botão. A altura por campo cai para ~56 pt e a coluna inteira
 * de campos passa a caber acima da dobra.
 *
 * **Acessibilidade não regrediu.** O `accessible` fica na raiz com
 * `accessibilityRole="adjustable"` — um único alvo de foco que responde a
 * incremento/decremento, que é exatamente o contrato que VoiceOver e TalkBack
 * esperam de um stepper. Os `Pressable` internos deixam de ser focáveis
 * individualmente (comportamento correto aqui), mas seguem tocáveis.
 */
export function NumericStepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  unit,
  disabled = false,
}: {
  label: string;
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
          width: layout.stepperValue,
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
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={unit ? label + ', ' + unit : label}
      accessibilityValue={{ min, max, now: value }}
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
          accessibilityLabel={t('decrease')}
          disabled={atMin}
          onPress={decrease}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Icon name="minus" color={atMin ? colors.textTertiary : colors.textPrimary} />
        </Pressable>
        <View style={styles.value}>
          <Text variant="title2" weight="bold">
            {value.toLocaleString('pt-BR')}
          </Text>
          {unit ? (
            <Text variant="footnote" tone="tertiary">
              {unit}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('increase')}
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
