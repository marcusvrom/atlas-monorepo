import { useReducer, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckInInput, type CheckInEntry } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Card, Text, Input, Chip, Button, ProgressBar, ErrorState } from '../../design/components';
import { useSaveCheckIn } from '../../data/queries/check-ins';
import { newId } from '../../lib/id';
import { t } from '../../i18n';
import { RatingChoices } from './RatingChoices';
export function CheckInForm({
  initial,
  date,
  rehabilitation,
}: {
  initial?: CheckInEntry;
  date: string;
  rehabilitation: boolean;
}) {
  const [form, change] = useReducer(
    (
      state: {
        hours: string;
        quality: number | null;
        energy: number | null;
        pain: number | null;
        step: number;
      },
      patch: Partial<typeof state>,
    ) => ({ ...state, ...patch }),
    {
      hours: initial?.sleepHours?.toString() ?? '',
      quality: initial?.sleepQuality ?? null,
      energy: initial?.energy ?? null,
      pain: initial?.painLevel ?? null,
      step: 0,
    },
  );
  const [invalid, setInvalid] = useState(false),
    save = useSaveCheckIn();
  const count = rehabilitation ? 3 : 2;
  const hours = form.hours.trim() === '' ? null : Number(form.hours.replace(',', '.'));
  const sleepReady =
    hours !== null && Number.isFinite(hours) && hours >= 0 && hours <= 24 && form.quality !== null;
  const ready =
    form.step === 0 ? sleepReady : form.step === 1 ? form.energy !== null : form.pain !== null;
  const submit = (status: 'draft' | 'completed') => {
    const parsed = CheckInInput.safeParse({
      clientGeneratedId: newId(),
      date,
      sleepHours: hours,
      sleepQuality: form.quality,
      energy: form.energy,
      painLevel: rehabilitation ? form.pain : null,
      status,
    });
    if (!parsed.success || (status === 'completed' && rehabilitation && form.pain === null)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    save.mutate(parsed.data);
  };
  return (
    <Card>
      <Text variant="footnote" tone="brand" weight="bold">
        {t('checkInStep')} {form.step + 1} / {count}
      </Text>
      <ProgressBar
        value={
          (Number(sleepReady) +
            Number(form.energy !== null) +
            (rehabilitation ? Number(form.pain !== null) : 0)) /
          count
        }
        label={t('checkInTitle')}
      />
      <Text variant="title2" weight="bold">
        {t(form.step === 0 ? 'checkInSleep' : form.step === 1 ? 'checkInEnergy' : 'checkInPain')}
      </Text>
      {form.step === 0 ? (
        <>
          <Input
            label={t('checkInSleepHours')}
            keyboardType="decimal-pad"
            value={form.hours}
            onChangeText={(hours) => change({ hours })}
          />
          <RatingChoices
            kind="quality"
            value={form.quality}
            onChange={(quality) => change({ quality })}
          />
        </>
      ) : form.step === 1 ? (
        <RatingChoices
          kind="energy"
          value={form.energy}
          onChange={(energy) => change({ energy })}
        />
      ) : (
        <>
          <Text tone="secondary" variant="subhead">
            {t('checkInPainHint')}
          </Text>
          <View style={styles.options}>
            {Array.from({ length: 11 }, (_, score) => (
              <Chip
                key={score}
                label={String(score)}
                selected={form.pain === score}
                onPress={() => change({ pain: score })}
              />
            ))}
          </View>
        </>
      )}
      {invalid ? (
        <Text tone="danger" accessibilityRole="alert">
          {t('checkInIncomplete')}
        </Text>
      ) : null}
      {save.isError ? (
        <ErrorState
          message={t('checkInError')}
          onRetry={() => save.variables && save.mutate(save.variables)}
        />
      ) : null}
      {save.isSuccess ? (
        <Text tone="success" accessibilityLiveRegion="polite">
          {t(save.data.status === 'completed' ? 'checkInSaved' : 'checkInDraftSaved')}
        </Text>
      ) : null}
      <View style={styles.options}>
        {form.step > 0 ? (
          <Button
            variant="ghost"
            label={t('back')}
            onPress={() => change({ step: form.step - 1 })}
          />
        ) : null}
        <Button
          variant="ghost"
          label={t('checkInDraft')}
          busy={save.isPending}
          onPress={() => submit('draft')}
        />
      </View>
      <Button
        label={t(form.step === count - 1 ? 'checkInFinish' : 'next')}
        disabled={!ready}
        busy={save.isPending}
        onPress={() => {
          if (form.step === count - 1) submit('completed');
          else change({ step: form.step + 1 });
        }}
      />
    </Card>
  );
}
const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
