import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  Card,
  ErrorState,
  LoadingState,
  ProgressRing,
  Text,
} from '../../design/components';
import { useHydrationDay, useLogWater, localDay } from '../../data/queries/nutrition';
import { t } from '../../i18n';
import { newId } from '../../lib/id';

const GLASS_ML = 250;
const BOTTLE_ML = 500;

/**
 * ATL-NUT-001 — hidratação do dia.
 *
 * Vindo do `WaterService` do healthapp. A meta (35 ml/kg) e o cronograma saem
 * do domínio; aqui só se registra e se mostra.
 *
 * Os dois botões de volume fixo existem porque hidratação só é registrada se
 * custar um toque: um campo numérico transformaria "bebi água" numa tarefa, e
 * a série de consumo do dia deixaria de existir por abandono.
 */
export function HydrationCard() {
  const date = localDay();
  const day = useHydrationDay(date);
  const log = useLogWater();

  const add = (volumeMl: number) => log.mutate({ clientGeneratedId: newId(), date, volumeMl });

  return (
    <Card>
      <View style={styles.head}>
        <Text variant="title3" weight="bold">
          {t('hydrationTitle')}
        </Text>
        <Text variant="footnote" tone="secondary">
          {t('hydrationSubtitle')}
        </Text>
      </View>

      {day.isPending ? (
        <LoadingState />
      ) : day.isError ? (
        <ErrorState message={t('hydrationError')} onRetry={() => void day.refetch()} />
      ) : (
        <>
          {/* Anel + números numa linha; os botões numa linha própria. Aninhar os
              botões dentro da coluna do texto os espremia a ponto de quebrarem
              em duas linhas num aparelho estreito. */}
          <View style={styles.body}>
            <ProgressRing
              value={day.data.targetMl > 0 ? day.data.consumedMl / day.data.targetMl : 0}
              label={t('hydrationTitle')}
              accent="activity"
              size={spacing.huge + spacing.xl}
            />
            <View style={styles.meta}>
              <Text variant="title2" weight="bold">
                {day.data.consumedMl.toLocaleString('pt-BR')}
                <Text variant="subhead" tone="secondary">
                  {' '}
                  {t('hydrationOf')} {day.data.targetMl.toLocaleString('pt-BR')} {t('milliliters')}
                </Text>
              </Text>
              {day.data.consumedMl >= day.data.targetMl && day.data.targetMl > 0 ? (
                <Text variant="footnote" tone="success" accessibilityLiveRegion="polite">
                  {t('hydrationDone')}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              label={t('hydrationGlass')}
              busy={log.isPending}
              onPress={() => add(GLASS_ML)}
              style={styles.action}
            />
            <Button
              label={t('hydrationBottle')}
              variant="ghost"
              busy={log.isPending}
              onPress={() => add(BOTTLE_ML)}
              style={styles.action}
            />
          </View>
        </>
      )}
      {log.isError ? <ErrorState message={t('hydrationError')} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  body: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.lg },
  meta: { flex: 1, minWidth: spacing.huge * 2, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
