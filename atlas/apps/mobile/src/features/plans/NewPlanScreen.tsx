import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { GoalType, CreatePlanInput } from '@atlas/contracts';
import { ApiError } from '@atlas/api-client';
import { useRouter } from 'expo-router';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  Chip,
  ErrorState,
  Input,
  NumericStepper,
  Screen,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { newId } from '../../lib/id';
import { useCreatePlan, usePlanActions } from './hooks';
import { emptyDay } from './editor-state';
export function NewPlanScreen() {
  const router = useRouter(),
    create = useCreatePlan(),
    { update } = usePlanActions();
  const [name, setName] = useState(''),
    [goal, setGoal] = useState<GoalType>('hypertrophy'),
    [count, setCount] = useState(3),
    [invalid, setInvalid] = useState(false);
  const submit = async () => {
    const parsed = CreatePlanInput.safeParse({ name: name.trim(), goal });
    if (!parsed.success) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    try {
      const plan = create.data ?? (await create.mutateAsync(parsed.data));
      await update.mutateAsync({
        id: plan.id,
        input: {
          ...parsed.data,
          days: Array.from({ length: count }, (_, i) =>
            emptyDay(newId(), i, t('planDay') + ' ' + (i + 1)),
          ),
        },
      });
      router.replace({ pathname: '/plan/[id]/edit', params: { id: plan.id } });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'quotaExceeded')
        router.push({ pathname: '/paywall', params: { feature: 'activeWorkoutPlans' } });
    }
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
        <Text variant="title1" weight="bold">
          {t('newPlan')}
        </Text>
        <Input label={t('planName')} value={name} onChangeText={setName} />
        <Text tone="secondary" variant="subhead">
          {t('currentGoal')}
        </Text>
        <View style={styles.row}>
          {GoalType.options.map((value) => (
            <Chip
              key={value}
              label={t(value)}
              selected={goal === value}
              onPress={() => setGoal(value)}
            />
          ))}
        </View>
        <NumericStepper label={t('planDays')} value={count} min={1} max={7} onChange={setCount} />
        {invalid ? <Text tone="danger">{t('planNameInvalid')}</Text> : null}
        {create.isError || update.isError ? <ErrorState message={t('planSaveError')} /> : null}
        <Button
          label={t('create')}
          busy={create.isPending || update.isPending}
          onPress={() => void submit()}
        />
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge, gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
