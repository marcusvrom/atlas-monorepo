import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { glass, radius, spacing } from '@atlas/design-tokens';
import { Card, Icon, Text } from '../../design/components';
import { useTheme } from '../../design/theme-provider';
import { t } from '../../i18n';

/**
 * ATL-UI-014 — execução e erros como duas listas com cabeçalho próprio.
 *
 * Antes as duas listas eram um array só, renderizado por uma `FlashList` em que
 * **cada linha repetia o rótulo da sua seção**. A tela mostrava "Pontos de
 * execução" três vezes seguidas e "Erros comuns" outras três — o rótulo
 * competia com o conteúdo em toda linha e o agrupamento nunca aparecia.
 *
 * Aqui o rótulo é dito uma vez. Os pontos de execução ganham numeração (é uma
 * sequência: escápulas antes da descida, descida antes da subida) e os erros
 * ganham um marcador de alerta — o mesmo conteúdo, com a estrutura que ele
 * sempre teve.
 */
export function ExerciseSteps({ cues, mistakes }: { cues: string[]; mistakes: string[] }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
        list: { gap: spacing.md },
        step: {
          width: spacing.xl,
          height: spacing.xl,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.backgroundElevated,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
        },
        // Alinha o marcador com a primeira linha do texto, não com o bloco.
        marker: { paddingTop: spacing.xxs },
        text: { flex: 1 },
      }),
    [colors],
  );

  return (
    <>
      {cues.length ? (
        <Card>
          <Text weight="bold">{t('catalogCues')}</Text>
          <View style={styles.list}>
            {cues.map((cue, index) => (
              <View key={cue} style={styles.row}>
                <View style={styles.step}>
                  <Text variant="caption" weight="bold" tone="brand">
                    {index + 1}
                  </Text>
                </View>
                <Text style={styles.text}>{cue}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {mistakes.length ? (
        <Card>
          <Text weight="bold">{t('catalogMistakes')}</Text>
          <View style={styles.list}>
            {mistakes.map((mistake) => (
              <View key={mistake} style={styles.row}>
                <View style={styles.marker}>
                  <Icon name="alert" size={spacing.lg} color={colors.warning} />
                </View>
                <Text style={styles.text}>{mistake}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </>
  );
}
