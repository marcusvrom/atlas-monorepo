import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@atlas/design-tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  LoadingState,
  MetricTile,
  NumericStepper,
  ProgressRing,
  Screen,
  SegmentedControl,
  Sheet,
  Sparkline,
  Text,
  showToast,
} from '../design/components';
import { t } from '../i18n';
export function DesignSystemScreen() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [amount, setAmount] = useState(3);
  const [selected, setSelected] = useState('first');
  const [sheet, setSheet] = useState(false);
  const announce = () => showToast(t('dsToastMessage'));
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" weight="bold">
          {t('designSystem')}
        </Text>
        <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
        <Card>
          <View style={styles.group}>
            <Button label={t('dsSolid')} onPress={announce} />
            <Button label={t('dsGhost')} variant="ghost" onPress={announce} />
            <Button label={t('dsDanger')} variant="danger" onPress={announce} />
            <Button label={t('dsPressed')} previewPressed onPress={announce} />
            <Button label={t('dsDisabled')} disabled onPress={announce} />
          </View>
        </Card>
        <Input label={t('dsInput')} hint={t('dsHint')} value={value} onChangeText={setValue} />
        <Input
          label={t('dsError')}
          error={t('dsInputError')}
          value={value}
          onChangeText={setValue}
        />
        <Input label={t('dsDisabled')} editable={false} value={value} />
        <NumericStepper
          label={t('dsStepper')}
          value={amount}
          onChange={setAmount}
          min={0}
          max={12}
        />
        <NumericStepper label={t('dsDisabled')} value={amount} onChange={setAmount} disabled />
        <SegmentedControl
          label={t('dsChoice')}
          value={selected}
          onChange={setSelected}
          options={[
            { value: 'first', label: t('dsFirst') },
            { value: 'second', label: t('dsSecond') },
          ]}
        />
        <Chip label={t('dsDisabled')} disabled onPress={announce} />
        <View style={styles.row}>
          <Badge label={t('dsSuccess')} tone="success" />
          <Badge label={t('dsWarning')} tone="warning" />
          <Badge label={t('dsError')} tone="danger" />
        </View>
        <Divider />
        <ListRow
          title={t('dsRow')}
          description={t('dsDescription')}
          actionLabel={t('dsOpen')}
          onPress={announce}
        />
        <MetricTile
          label={t('dsMetric')}
          value={t('dsMetricValue')}
          delta={t('dsMetricDelta')}
          deltaTone="success"
        />
        <ProgressRing value={0.6} label={t('dsProgress')} />
        <Sparkline values={sample} label={t('dsProgress')} emptyLabel={t('dsEmpty')} />
        <Sparkline values={empty} label={t('dsProgress')} emptyLabel={t('dsEmpty')} />
        <LoadingState />
        <EmptyState
          title={t('dsEmptyTitle')}
          description={t('dsEmptyDescription')}
          actionLabel={t('dsOpen')}
          onAction={announce}
        />
        <ErrorState message={t('dsInputError')} onRetry={announce} />
        <Button label={t('dsSheet')} onPress={() => setSheet(true)} />
        <Button label={t('dsToast')} onPress={announce} />
      </ScrollView>
      <Sheet visible={sheet} title={t('dsSheetTitle')} onClose={() => setSheet(false)}>
        <Text>{t('dsSheetDescription')}</Text>
        <Input label={t('dsInput')} value={value} onChangeText={setValue} />
      </Sheet>
    </Screen>
  );
}
const sample = [2, 3, 2, 6, 7, 5, 9];
const empty: number[] = [];
const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg },
  group: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
