import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { SessionSummary } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Card, Text, SegmentedControl, Button, Sheet, EmptyState } from '../../design/components';
import {
  formatCount,
  formatDateRange,
  formatDurationMinutes,
  formatShortDate,
  formatTonnage,
} from '../../lib/format';
import { plural, t } from '../../i18n';
import { activityBuckets } from './activity-buckets';
import { shiftDay } from './dashboard-math';
import { describeSeries } from './chart-summary';
import { ActivityBar } from './ActivityBar';

type Metric = 'volume' | 'minutes' | 'sets';

/** Frase que segue o número grande ("17,5 t · de carga levantada"). */
const UNIT_KEY: Record<Metric, Parameters<typeof t>[0]> = {
  volume: 'activityUnitVolume',
  minutes: 'activityUnitMinutes',
  sets: 'activityUnitSets',
};

/**
 * Nome da métrica, para título e descrição acessível.
 *
 * Separado da frase de unidade porque as duas têm gramática diferente: "Carga"
 * é um rótulo, "de carga levantada" é um complemento. Usar o complemento como
 * rótulo produzia "Seu ritmo de treino · de carga levantada", que não é uma
 * frase em português.
 */
const METRIC_KEY: Record<Metric, Parameters<typeof t>[0]> = {
  volume: 'activityVolume',
  minutes: 'activityMinutes',
  sets: 'activitySets',
};

/**
 * Distribuição da atividade no período, em sete blocos.
 *
 * A unidade aparece **uma vez**, no título do bloco — antes ela se repetia no
 * número grande, no rótulo de cada barra e no resumo, três vezes na mesma
 * dobra. Cada métrica também passou a ter sua própria formatação: volume é
 * inteiro, duração vira "1 h 08 min", séries são contagem. Imprimir os três com
 * o mesmo formatador era o que produzia "3.300 min" onde cabia "55 h".
 *
 * O período sem nenhum treino não desenha barras zeradas: sete colunas rentes
 * ao chão parecem um gráfico quebrado, e não "ainda não há o que mostrar".
 */
export function ActivityTimeline({
  sessions,
  days,
  now,
}: {
  sessions: SessionSummary[];
  days: 7 | 30 | 90;
  now: Date;
}) {
  const [metric, setMetric] = useState<Metric>('volume'),
    [selected, setSelected] = useState(6),
    [open, setOpen] = useState(false);
  const router = useRouter();
  const buckets = useMemo(() => activityBuckets(sessions, days, now), [sessions, days, now]);
  const bucket = buckets[selected] ?? buckets[6]!;
  const max = Math.max(0, ...buckets.map((item) => item[metric]));
  const total = buckets.reduce((sum, item) => sum + item[metric], 0);

  // Mesma função para o número grande, o rótulo da barra e a descrição: o que o
  // leitor de tela ouve é exatamente o que está desenhado.
  const display = (value: number) =>
    metric === 'volume'
      ? formatTonnage(value)
      : metric === 'minutes'
        ? formatDurationMinutes(value)
        : formatCount(value);

  const range = formatDateRange(bucket.from, shiftDay(bucket.to, -1));

  const summary = useMemo(
    () =>
      describeSeries({
        label: t('activityTitle') + ' · ' + t(METRIC_KEY[metric]),
        // A unidade já vai embutida na formatação de cada métrica (min/h), e
        // volume e séries carregam a sua no título do bloco.
        unit: '',
        points: buckets.map((item) => ({ at: item.from.toISOString(), value: item[metric] })),
        format: display,
      }),
    // `display` é derivada de `metric`; listá-la traria uma nova identidade por
    // render e o memo deixaria de existir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buckets, metric],
  );

  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('activityTitle')}
      </Text>
      <Text variant="footnote" tone="secondary">
        {t('activityHint')}
      </Text>
      <SegmentedControl
        label={t('activityTitle')}
        value={metric}
        options={[
          { value: 'volume', label: t('activityVolume') },
          { value: 'minutes', label: t('activityMinutes') },
          { value: 'sets', label: t('activitySets') },
        ]}
        onChange={(value) =>
          setMetric(value === 'minutes' ? 'minutes' : value === 'sets' ? 'sets' : 'volume')
        }
      />

      {total === 0 ? (
        <View style={styles.empty}>
          <Text tone="secondary">{t('activityEmptyTitle')}</Text>
          <Text variant="footnote" tone="tertiary">
            {t('activityEmptyWhy')}
          </Text>
          <Button variant="ghost" label={t('plans')} onPress={() => router.push('/(tabs)/plans')} />
        </View>
      ) : (
        <>
          <Text variant="footnote" tone="brand" weight="bold">
            {t('activitySelected')}
          </Text>
          <Text variant="display" weight="bold">
            {display(bucket[metric])}
          </Text>
          <Text tone="secondary">{t(UNIT_KEY[metric])}</Text>
          {metric === 'volume' ? (
            <Text variant="caption" tone="tertiary">
              {t('tonnageExplained')}
            </Text>
          ) : null}
          <View style={styles.chart}>
            {buckets.map((item, index) => (
              <ActivityBar
                key={item.from.toISOString()}
                value={item[metric]}
                valueLabel={display(item[metric]) + ' ' + t(UNIT_KEY[metric])}
                max={max}
                label={formatShortDate(item.from)}
                selected={index === selected}
                onPress={() => setSelected(index)}
              />
            ))}
          </View>
          <Text weight="semibold">{range}</Text>
          <Text tone="secondary" variant="footnote">
            {formatCount(bucket.records.length)}{' '}
            {plural(bucket.records.length, 'activitySessionCountOne', 'activitySessionCount')}
          </Text>
          {/* Alternativa textual do conjunto: o desenho diz a forma, esta linha
              diz período, sentido e extremos. */}
          <Text variant="footnote" tone="tertiary" accessibilityRole="summary">
            {summary}
          </Text>
          <Button variant="ghost" label={t('dashboardHistory')} onPress={() => setOpen(true)} />
        </>
      )}

      <Sheet visible={open} title={range} onClose={() => setOpen(false)}>
        <View style={styles.list}>
          <FlashList
            data={bucket.records}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <EmptyState
                title={t('activityNoRecords')}
                description={t('dashboardNoSessionHint')}
              />
            }
            renderItem={({ item }) => (
              <Button
                variant="ghost"
                label={formatShortDate(item.startedAt) + ' · ' + item.dayLabel}
                onPress={() => {
                  setOpen(false);
                  router.push({ pathname: '/session/[id]', params: { id: item.id } });
                }}
              />
            )}
          />
        </View>
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: spacing.xxs, alignItems: 'flex-end' },
  list: { height: spacing.huge * 4 },
  empty: { gap: spacing.xs, paddingVertical: spacing.lg },
});
