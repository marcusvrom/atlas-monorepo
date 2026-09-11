import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { DailyTargets } from '@atlas/contracts';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  Card,
  CoverImage,
  ErrorState,
  IconButton,
  LoadingState,
  MetaChip,
  MetaChipRow,
  MetricTile,
  Screen,
  SectionHeader,
  Text,
} from '../../design/components';
import { CoverScrim } from '../../design/media';
import { useDailyTargets } from '../../data/queries/nutrition';
import { t } from '../../i18n';
import { HydrationCard } from './HydrationCard';

/**
 * ATL-NUT-001 — metas metabólicas do dia.
 *
 * A feature mais substantiva trazida do `marcusvrom/healthapp`: o Atlas já
 * guardava peso, altura, nascimento e objetivo, mas nunca transformava isso num
 * número acionável. Aqui a mesma biometria vira TMB, manutenção, alvo, macros e
 * água.
 *
 * Duas obrigações que a tela cumpre e não são negociáveis:
 *
 * 1. **O aviso aparece sempre.** `disclaimerKey` vem no contrato justamente
 *    para que nenhuma versão da tela "esqueça" de dizer que é estimativa, não
 *    prescrição.
 * 2. **Dado faltando é pedido, não escondido.** Sem peso ou nascimento a
 *    estimativa fica incompleta; mostrar um número redondo mesmo assim seria
 *    apresentar um chute como se fosse do usuário.
 */
const MISSING_LABEL: Record<DailyTargets['missingInputs'][number], Parameters<typeof t>[0]> = {
  weight: 'nutritionMissingWeight',
  height: 'nutritionMissingHeight',
  birthDate: 'nutritionMissingBirthDate',
  sex: 'nutritionMissingSex',
  goal: 'nutritionMissingGoal',
};

/** Quanto o macro representa das calorias — o que um gráfico de pizza diria. */
function macroShare(macroKcal: number, totalKcal: number): string {
  if (totalKcal <= 0) return '—';
  return Math.round((macroKcal / totalKcal) * 100) + '% ' + t('nutritionOfCalories');
}

export function NutritionScreen() {
  const router = useRouter();
  const targets = useDailyTargets();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View>
          <CoverImage seed="nutrition-targets" glyph="flame" radius="xxl" style={styles.hero}>
            <CoverScrim />
            <View style={styles.heroBody}>
              <Text tone="onAccent" variant="caption" weight="bold">
                {t('nutritionSubtitle').toUpperCase()}
              </Text>
              <Text tone="onAccent" variant="display" weight="bold">
                {targets.data ? Math.round(targets.data.targetKcal).toLocaleString('pt-BR') : '—'}{' '}
                {t('nutritionKcal')}
              </Text>
              {targets.data ? (
                <MetaChipRow>
                  <MetaChip
                    onCover
                    icon="bolt"
                    label={
                      t('nutritionBasal') +
                      ' ' +
                      Math.round(targets.data.basalKcal).toLocaleString('pt-BR')
                    }
                  />
                  <MetaChip
                    onCover
                    icon="target"
                    label={
                      t('nutritionMaintenance') +
                      ' ' +
                      Math.round(targets.data.maintenanceKcal).toLocaleString('pt-BR')
                    }
                  />
                </MetaChipRow>
              ) : null}
            </View>
          </CoverImage>
          <View style={styles.heroBack}>
            <IconButton icon="back" label={t('back')} onPress={() => router.back()} />
          </View>
        </View>

        {targets.isPending ? (
          <LoadingState />
        ) : targets.isError ? (
          <ErrorState message={t('nutritionError')} onRetry={() => void targets.refetch()} />
        ) : (
          <>
            {targets.data.missingInputs.length ? (
              <Card>
                <Text weight="bold">{t('nutritionMissingTitle')}</Text>
                <Text tone="secondary" variant="subhead">
                  {t('nutritionMissingBody').replace(
                    '{fields}',
                    targets.data.missingInputs.map((field) => t(MISSING_LABEL[field])).join(', '),
                  )}
                </Text>
                <Button
                  label={t('nutritionOpenProfile')}
                  variant="ghost"
                  onPress={() => router.push('/(tabs)/profile')}
                />
              </Card>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title={t('nutritionMacros')} />
              <View style={styles.grid}>
                <View style={styles.tile}>
                  <MetricTile
                    label={t('nutritionProtein')}
                    value={
                      Math.round(targets.data.macros.proteinG).toLocaleString('pt-BR') +
                      ' ' +
                      t('nutritionGrams')
                    }
                    delta={macroShare(
                      targets.data.macros.proteinG * 4,
                      targets.data.macros.energyFromMacrosKcal,
                    )}
                    accent="strength"
                    style={styles.fill}
                  />
                </View>
                <View style={styles.tile}>
                  <MetricTile
                    label={t('nutritionCarbs')}
                    value={
                      Math.round(targets.data.macros.carbsG).toLocaleString('pt-BR') +
                      ' ' +
                      t('nutritionGrams')
                    }
                    delta={macroShare(
                      targets.data.macros.carbsG * 4,
                      targets.data.macros.energyFromMacrosKcal,
                    )}
                    accent="activity"
                    style={styles.fill}
                  />
                </View>
                <View style={styles.tile}>
                  <MetricTile
                    label={t('nutritionFat')}
                    value={
                      Math.round(targets.data.macros.fatG).toLocaleString('pt-BR') +
                      ' ' +
                      t('nutritionGrams')
                    }
                    delta={macroShare(
                      targets.data.macros.fatG * 9,
                      targets.data.macros.energyFromMacrosKcal,
                    )}
                    accent="energy"
                    style={styles.fill}
                  />
                </View>
                <View style={styles.tile}>
                  <MetricTile
                    label={t('nutritionGoalAdjustment')}
                    value={
                      (targets.data.goalAdjustmentKcal > 0 ? '+' : '') +
                      targets.data.goalAdjustmentKcal.toLocaleString('pt-BR') +
                      ' ' +
                      t('nutritionKcal')
                    }
                    accent="primary"
                    style={styles.fill}
                  />
                </View>
              </View>

              {/* O domínio expõe quando os macros não fecham na meta; a tela
                  mostra em vez de esconder. Ver `macroTargets` em @atlas/domain. */}
              {Math.round(targets.data.macros.energyFromMacrosKcal) >
              Math.round(targets.data.targetKcal) ? (
                <Text variant="footnote" tone="warning">
                  {t('nutritionMacroMismatch').replace(
                    '{kcal}',
                    Math.round(targets.data.macros.energyFromMacrosKcal).toLocaleString('pt-BR'),
                  )}
                </Text>
              ) : null}
            </View>

            <HydrationCard />

            <View style={styles.footer}>
              {/* Obrigatório: o contrato carrega a chave para que nenhuma versão
                  desta tela apresente a estimativa sem o aviso. */}
              <Text variant="footnote" tone="secondary">
                {t(targets.data.disclaimerKey as Parameters<typeof t>[0])}
              </Text>
              <Text variant="caption" tone="tertiary">
                {t('nutritionFormula').replace('{version}', String(targets.data.formulaVersion))}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: layout.pageInset,
    paddingBottom: spacing.huge * 2,
    gap: layout.sectionGap,
  },
  hero: { height: layout.coverHero },
  heroBody: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
  heroBack: { position: 'absolute', top: spacing.md, left: spacing.md },
  section: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: spacing.md },
  tile: { flexBasis: '45%', flexGrow: 1, minWidth: spacing.huge * 2 },
  fill: { flex: 1 },
  footer: { gap: spacing.xs },
});
