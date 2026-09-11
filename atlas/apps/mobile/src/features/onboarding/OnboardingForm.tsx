import { useMemo, useState } from 'react';
import {
  BiologicalSex,
  BodyRegion,
  CurrentGoal,
  Difficulty,
  Equipment,
  GoalType,
  OnboardingDraft,
  RecordMeasurementInput,
  TrainingPreferences,
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
  SectionHeader,
  Text,
} from '../../design/components';
import { ProfilePhotoPicker } from '../avatar/ProfilePhotoPicker';
import { formatBodyMeasurement, formatDate } from '../../lib/format';
import { t } from '../../i18n';
import {
  equipmentLabel,
  levelHint,
  levelLabel,
  regionLabel,
  sexLabel,
} from '../../i18n/enum-labels';
import { newId } from '../../lib/id';
import { useSaveOnboarding } from './hooks';

function optionalNumber(value: string) {
  return value.trim() ? Number(value.replace(',', '.')) : null;
}

/** Alterna um item numa lista de seleção múltipla, preservando a ordem do enum. */
function toggle<T>(list: readonly T[], value: T, order: readonly T[]): T[] {
  const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  return order.filter((item) => next.includes(item));
}

const STEPS = ['profile', 'goal', 'preferences', 'availability', 'baseline'] as const;

const STEP_TITLE: Record<(typeof STEPS)[number], Parameters<typeof t>[0]> = {
  profile: 'profileStep',
  goal: 'goalStep',
  preferences: 'preferencesStep',
  availability: 'availabilityStep',
  baseline: 'baselineStep',
};

/**
 * Primeiro acesso.
 *
 * Cinco passos, e cada um justifica sua existência por uma decisão que o app
 * toma depois com a resposta:
 *
 * - **Perfil** — nome, foto, altura, nascimento e sexo biológico. O sexo entra
 *   aqui, e não numa tela escondida de ajustes, porque a estimativa metabólica
 *   depende dele: sem a resposta, a tela de metas mostra "faltam dados" no
 *   primeiro dia de uso. A foto é opcional e cai para as iniciais.
 * - **Objetivo** — com as guardas de meta que já existiam.
 * - **Preferências** — nível, regiões a poupar, equipamento disponível. É o
 *   passo que personaliza catálogo e sugestão de ficha.
 * - **Disponibilidade** e **medidas** — como antes.
 *
 * O passo de preferências é o único com aviso explícito de que o app não
 * substitui avaliação profissional. Perguntar "o que dói" cria uma expectativa
 * clínica que o produto não pode cumprir, e a hora de desfazer essa expectativa
 * é no momento da pergunta.
 */
export function OnboardingForm({ initial }: { initial: OnboardingDraft }) {
  const router = useRouter();
  const save = useSaveOnboarding();
  const [step, setStep] = useState(initial.step);
  const [name, setName] = useState(initial.profile.displayName);
  const [photoUri, setPhotoUri] = useState(initial.photoUri);
  const [height, setHeight] = useState(String(initial.profile.heightCm ?? ''));
  const [birth, setBirth] = useState(initial.profile.birthDate ?? '');
  const [sex, setSex] = useState<BiologicalSex>(initial.profile.biologicalSex ?? 'unspecified');
  const [goal, setGoal] = useState<GoalType>(initial.goal?.type ?? 'generalHealth');
  const [target, setTarget] = useState(String(initial.goal?.targetWeightKg ?? ''));
  const [date, setDate] = useState(initial.goal?.targetDate?.slice(0, 10) ?? '');
  const [weekly, setWeekly] = useState(initial.goal?.weeklySessionTarget ?? 3);
  const [weight, setWeight] = useState(String(initial.baseline?.weightKg ?? ''));
  const [level, setLevel] = useState<Difficulty>(
    initial.profile.trainingPreferences?.experienceLevel ?? 'beginner',
  );
  const [regions, setRegions] = useState<BodyRegion[]>(
    initial.profile.trainingPreferences?.protectedRegions ?? [],
  );
  const [equipment, setEquipment] = useState<Equipment[]>(
    initial.profile.trainingPreferences?.availableEquipment ?? [],
  );
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
    const preferences = TrainingPreferences.safeParse({
      experienceLevel: level,
      protectedRegions: regions,
      // Lista vazia significa "não restringi nada", e não "não tenho nada":
      // ver a distinção entre `null` e `[]` em `TrainingPreferences`.
      availableEquipment: equipment.length ? equipment : null,
    });
    const profile = UpdateProfileInput.safeParse({
      displayName: name.trim(),
      heightCm: optionalNumber(height),
      birthDate: birth || null,
      biologicalSex: sex,
      activityLevel: initial.profile.activityLevel,
      trainingPreferences: preferences.success ? preferences.data : null,
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
        photoUri,
        goal: goalResult.data,
        baseline: baseline?.success ? baseline.data : null,
      },
      {
        onSuccess: () => {
          setStep(next);
          // ATL-ONB-002: o onboarding coleta dados; o tour apresenta o app.
          // São coisas diferentes e ficam em telas diferentes.
          if (next === 'complete') router.replace('/(auth)/tour');
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

  const nextStep = (): OnboardingDraft['step'] => {
    const index = STEPS.indexOf(step as (typeof STEPS)[number]);
    return index < 0 || index === STEPS.length - 1 ? 'complete' : STEPS[index + 1]!;
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="title1" weight="bold">
          {t('onboardingTitle')}
        </Text>
        <Text variant="title2">
          {t(STEP_TITLE[step as (typeof STEPS)[number]] ?? 'profileStep')}
        </Text>

        {step === 'profile' ? (
          <>
            <Input label={t('displayName')} value={name} onChangeText={setName} />
            <ProfilePhotoPicker
              userId="onboarding"
              name={name || t('displayName')}
              photoUri={photoUri}
              onChange={setPhotoUri}
            />
            <Input
              label={t('height')}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
            <Input label={t('birthDate')} value={birth} onChangeText={setBirth} />
            <SectionHeader title={t('profileBiologicalSex')} />
            <View style={styles.options}>
              {BiologicalSex.options.map((value) => (
                <Chip
                  key={value}
                  label={t(sexLabel[value])}
                  selected={sex === value}
                  onPress={() => setSex(value)}
                />
              ))}
            </View>
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
                  ? ` ${t('targetWeight')}: ${formatBodyMeasurement(violation.suggestion.targetWeightKg)}`
                  : ''}
                {violation.suggestion?.targetDateIso
                  ? ` ${t('targetDate')}: ${formatDate(violation.suggestion.targetDateIso)}`
                  : ''}
              </Text>
            ))}
            {violations.length ? (
              <Button label={t('safeSuggestion')} variant="ghost" onPress={applySuggestion} />
            ) : null}
          </>
        ) : null}

        {step === 'preferences' ? (
          <>
            <Text tone="secondary">{t('preferencesIntro')}</Text>

            <SectionHeader title={t('preferencesLevel')} />
            <View style={styles.levels}>
              {Difficulty.options.map((value) => (
                <View key={value} style={styles.level}>
                  <Chip
                    label={t(levelLabel[value])}
                    selected={level === value}
                    onPress={() => setLevel(value)}
                  />
                  <Text variant="footnote" tone="secondary">
                    {t(levelHint[value])}
                  </Text>
                </View>
              ))}
            </View>

            <SectionHeader title={t('preferencesRegions')} subtitle={t('preferencesRegionsHint')} />
            <View style={styles.options}>
              <Chip
                label={t('preferencesRegionsNone')}
                selected={regions.length === 0}
                onPress={() => setRegions([])}
              />
              {BodyRegion.options.map((value) => (
                <Chip
                  key={value}
                  label={t(regionLabel[value])}
                  selected={regions.includes(value)}
                  onPress={() => setRegions(toggle(regions, value, BodyRegion.options))}
                />
              ))}
            </View>

            <SectionHeader
              title={t('preferencesEquipment')}
              subtitle={t('preferencesEquipmentHint')}
            />
            <View style={styles.options}>
              {Equipment.options
                // `none` não é uma resposta útil aqui: "não tenho equipamento"
                // já é o estado de não marcar nada.
                .filter((value) => value !== 'none')
                .map((value) => (
                  <Chip
                    key={value}
                    label={t(equipmentLabel[value])}
                    selected={equipment.includes(value)}
                    onPress={() => setEquipment(toggle(equipment, value, Equipment.options))}
                  />
                ))}
            </View>

            <Text variant="footnote" tone="secondary">
              {t('preferencesDisclaimer')}
            </Text>
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
          onPress={() => persist(nextStep())}
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
  levels: { gap: spacing.md },
  // Cada nível é chip + explicação numa linha própria: lado a lado, as três
  // frases de apoio ficavam com duas palavras por linha num aparelho estreito.
  level: { gap: spacing.xxs },
});
