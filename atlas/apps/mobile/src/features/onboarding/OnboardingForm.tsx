import { useMemo, useState } from 'react';
import {
  CurrentGoal,
  GoalType,
  OnboardingDraft,
  RecordMeasurementInput,
  UpdateProfileInput,
} from '@atlas/contracts';
import { validateGoal } from '@atlas/domain';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
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
import { useSaveOnboarding } from './hooks';
function optionalNumber(value: string) {
  return value.trim() ? Number(value.replace(',', '.')) : null;
}
export function OnboardingForm({ initial }: { initial: OnboardingDraft }) {
  const router = useRouter();
  const save = useSaveOnboarding();
  const [step, setStep] = useState(initial.step);
  const [name, setName] = useState(initial.profile.displayName);
  const [height, setHeight] = useState(String(initial.profile.heightCm ?? ''));
  const [birth, setBirth] = useState(initial.profile.birthDate ?? '');
  const [goal, setGoal] = useState<GoalType>(initial.goal?.type ?? 'generalHealth');
  const [target, setTarget] = useState(String(initial.goal?.targetWeightKg ?? ''));
  const [date, setDate] = useState(initial.goal?.targetDate?.slice(0, 10) ?? '');
  const [weekly, setWeekly] = useState(initial.goal?.weeklySessionTarget ?? 3);
  const [weight, setWeight] = useState(String(initial.baseline?.weightKg ?? ''));
  const [error, setError] = useState(false);
  const [measurementId] = useState(() => initial.baseline?.clientGeneratedId ?? newId());
  const violations = useMemo(() => {
    const h = optionalNumber(height),
      w = optionalNumber(weight),
      tw = optionalNumber(target);
    if (!h || !w || !tw || !Number.isFinite(h + w + tw)) return [];
    return validateGoal({
      goal,
      currentWeightKg: w,
      heightCm: h,
      targetWeightKg: tw,
      targetDateIso: date ? date + 'T12:00:00.000Z' : null,
      nowIso: new Date().toISOString(),
    });
  }, [height, weight, target, date, goal]);
  const persist = (next: OnboardingDraft['step'], skip = false) => {
    const profile = UpdateProfileInput.safeParse({
      displayName: name.trim(),
      heightCm: optionalNumber(height),
      birthDate: birth || null,
    });
    const goalResult = CurrentGoal.safeParse({
      type: goal,
      targetDate: date ? date + 'T12:00:00.000Z' : null,
      targetWeightKg: optionalNumber(target),
      targetBodyFatPct: null,
      weeklySessionTarget: weekly,
    });
    const baseline =
      skip || !weight.trim()
        ? null
        : RecordMeasurementInput.safeParse({
            clientGeneratedId: measurementId,
            takenAt: new Date().toISOString(),
            weightKg: optionalNumber(weight),
            bodyFatPct: null,
            circumferences: null,
            notes: null,
          });
    const unsafe = !!target.trim() && (!height.trim() || !weight.trim() || violations.length > 0);
    if (
      !profile.success ||
      !name.trim() ||
      !goalResult.success ||
      (baseline && !baseline.success) ||
      ((step === 'goal' || next === 'complete') && unsafe)
    ) {
      setError(true);
      return;
    }
    setError(false);
    save.mutate(
      {
        step: next,
        profile: profile.data,
        goal: goalResult.data,
        baseline: baseline?.success ? baseline.data : null,
      },
      {
        onSuccess: () => {
          setStep(next);
          if (next === 'complete') router.replace('/(tabs)');
        },
      },
    );
  };
  const applySuggestion = () => {
    for (const violation of violations) {
      if (violation.suggestion?.targetWeightKg)
        setTarget(String(violation.suggestion.targetWeightKg));
      if (violation.suggestion?.targetDateIso)
        setDate(violation.suggestion.targetDateIso.slice(0, 10));
    }
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" weight="bold">
          {t('onboardingTitle')}
        </Text>
        <Text variant="title2">
          {step === 'profile'
            ? t('profileStep')
            : step === 'goal'
              ? t('goalStep')
              : step === 'availability'
                ? t('availabilityStep')
                : t('baselineStep')}
        </Text>
        {step === 'profile' ? (
          <>
            <Input label={t('displayName')} value={name} onChangeText={setName} />
            <Input
              label={t('height')}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
            <Input label={t('birthDate')} value={birth} onChangeText={setBirth} />
          </>
        ) : null}
        {step === 'goal' ? (
          <>
            <View style={styles.options}>
              {GoalType.options.map((value) => (
                <Chip
                  key={value}
                  label={t(value)}
                  selected={goal === value}
                  onPress={() => setGoal(value)}
                />
              ))}
            </View>
            <Input
              label={t('weight')}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <Input
              label={t('targetWeight')}
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
            />
            <Input label={t('targetDate')} value={date} onChangeText={setDate} />
            {violations.map((violation) => (
              <Text key={violation.code} tone="warning">
                {violation.code === 'targetBmiTooLow'
                  ? t('guardrailBmi')
                  : violation.code === 'weeklyRateTooAggressive'
                    ? t('guardrailRate')
                    : t('guardrailTime')}
                {violation.suggestion?.targetWeightKg != null
                  ? ` ${t('targetWeight')}: ${violation.suggestion.targetWeightKg.toLocaleString('pt-BR')}`
                  : ''}
                {violation.suggestion?.targetDateIso
                  ? ` ${t('targetDate')}: ${new Date(violation.suggestion.targetDateIso).toLocaleDateString('pt-BR')}`
                  : ''}
              </Text>
            ))}
            {violations.length ? (
              <Button label={t('safeSuggestion')} variant="ghost" onPress={applySuggestion} />
            ) : null}
          </>
        ) : null}
        {step === 'availability' ? (
          <NumericStepper
            label={t('weeklySessions')}
            value={weekly}
            onChange={setWeekly}
            min={1}
            max={14}
          />
        ) : null}
        {step === 'baseline' ? (
          <Input
            label={t('weight')}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" tone="danger">
            {t('onboardingError')}
          </Text>
        ) : null}
        {save.isError ? <ErrorState message={t('onboardingNetworkError')} /> : null}
        <Button
          label={step === 'baseline' ? t('finish') : t('next')}
          busy={save.isPending}
          onPress={() =>
            persist(
              step === 'profile'
                ? 'goal'
                : step === 'goal'
                  ? 'availability'
                  : step === 'availability'
                    ? 'baseline'
                    : 'complete',
            )
          }
        />
        {step === 'baseline' ? (
          <Button
            label={t('skip')}
            variant="ghost"
            busy={save.isPending}
            onPress={() => persist('complete', true)}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.huge, gap: spacing.lg },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
