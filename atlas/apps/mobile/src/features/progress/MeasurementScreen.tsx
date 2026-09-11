import { useReducer, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RecordMeasurementInput, Circumferences } from '@atlas/contracts';
import { spacing } from '@atlas/design-tokens';
import { Button, Input, Screen, Sheet, Text, ErrorState } from '../../design/components';
import { t } from '../../i18n';
import { newId } from '../../lib/id';
import { useRecordMeasurement, useEntitlement } from './hooks';
export function MeasurementScreen() {
  const router = useRouter(),
    save = useRecordMeasurement(),
    entitlement = useEntitlement('bodyCompositionTracking');
  const [id] = useState(newId);
  const [values, change] = useReducer(
    (state: Record<string, string>, patch: Record<string, string>) => ({ ...state, ...patch }),
    { weight: '', bodyFat: '' },
  );
  const [invalid, setInvalid] = useState(false);
  const number = (value: string | undefined) =>
    value?.trim() ? Number(value.replace(',', '.')) : null;
  const submit = () => {
    const fields = Object.fromEntries(
      Circumferences.keyof().options.map((key) => [key, number(values[key])]),
    );
    const hasFields = Object.values(fields).some((value) => value !== null);
    const input = RecordMeasurementInput.safeParse({
      clientGeneratedId: id,
      takenAt: new Date().toISOString(),
      weightKg: number(values.weight),
      bodyFatPct: entitlement.allowed ? number(values.bodyFat) : null,
      circumferences: hasFields ? fields : null,
      notes: null,
    });
    if (
      !input.success ||
      (input.data.weightKg === null && input.data.bodyFatPct === null && !hasFields)
    ) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    save.mutate(input.data, { onSuccess: () => router.back() });
  };
  return (
    <Screen>
      <Sheet visible title={t('measurementAdd')} onClose={() => router.back()}>
        <View style={styles.content}>
          <Input
            label={t('weight')}
            keyboardType="decimal-pad"
            value={values.weight ?? ''}
            onChangeText={(weight) => change({ weight })}
          />
          {entitlement.allowed ? (
            <Input
              label={t('bodyFatLabel')}
              keyboardType="decimal-pad"
              value={values.bodyFat ?? ''}
              onChangeText={(bodyFat) => change({ bodyFat })}
            />
          ) : (
            <Button
              label={t('compositionUnlock')}
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: '/paywall',
                  params: { feature: 'bodyCompositionTracking' },
                })
              }
            />
          )}
          <Text>{t('circumferencesOptional')}</Text>
          {Circumferences.keyof().options.map((key) => (
            <Input
              key={key}
              label={t(key)}
              value={values[key] ?? ''}
              keyboardType="decimal-pad"
              onChangeText={(value) => change({ [key]: value })}
            />
          ))}
          {invalid ? (
            <Text tone="danger" accessibilityRole="alert">
              {t('measurementInvalid')}
            </Text>
          ) : null}
          {save.isError ? <ErrorState message={t('measurementSaveError')} /> : null}
          <Button label={t('save')} busy={save.isPending} onPress={submit} />
        </View>
      </Sheet>
    </Screen>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.md } });
