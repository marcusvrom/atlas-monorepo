import { useMemo, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { PerformedSet, type ExercisePrescription, type TrainingSession } from '@atlas/contracts';
import { estimateOneRepMax } from '@atlas/domain';
import { spacing } from '@atlas/design-tokens';
import { MetaChip, MetaChipRow, NumericStepper, Text } from '../../design/components';
import { newId } from '../../lib/id';
import { showToast } from '../../design/components/toast-store';
import { plural, t } from '../../i18n';
import { useLogSets } from './hooks';
import { SessionControls } from './SessionControls';
import { previousBestOneRepMax } from './session-summary';

/**
 * ATL-SES-005 — registro de uma série.
 *
 * Duas mudanças além do layout:
 *
 * 1. **A referência da última vez aparece.** O dado já era carregado (`previous`
 *    alimentava os valores iniciais dos campos), mas nunca era mostrado — o
 *    usuário via "90 kg" pré-preenchido sem saber se era o alvo prescrito ou o
 *    que ele levantou da última vez. São coisas diferentes e agora estão
 *    rotuladas como tal.
 * 2. **O recorde é anunciado no momento.** Se a série registrada supera a melhor
 *    marca anterior, sai toast + haptic de sucesso. Antes isso só aparecia como
 *    um número no resumo, depois do treino inteiro.
 */
export function SetRecorder({
  session,
  exercise,
  previous,
  onRest,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  session: TrainingSession;
  exercise: ExercisePrescription;
  previous: TrainingSession | null;
  onRest: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  const completed = session.sets.filter((set) => set.exerciseId === exercise.exerciseId);
  const target = exercise.sets[Math.min(completed.length, exercise.sets.length - 1)]!;
  const last = previous?.sets
    .filter((set) => set.exerciseId === exercise.exerciseId)
    .at(Math.min(completed.length, exercise.sets.length - 1));

  const [input, change] = useReducer(
    (
      state: { weight: number; reps: number; rir: number; duration: number },
      patch: Partial<typeof state>,
    ) => ({ ...state, ...patch }),
    {
      weight: target.targetWeightKg ?? last?.weightKg ?? 0,
      reps: target.targetReps ?? last?.reps ?? 1,
      rir: target.targetRir ?? last?.rir ?? 2,
      duration: target.targetDurationSeconds ?? last?.durationSeconds ?? 0,
    },
  );

  const log = useLogSets(session.id);
  const byTime = target.targetDurationSeconds !== null;

  const record = () => {
    const set = PerformedSet.parse({
      clientGeneratedId: newId(),
      exerciseId: exercise.exerciseId,
      order: completed.length + 1,
      weightKg: input.weight,
      reps: byTime ? null : input.reps,
      durationSeconds: byTime ? input.duration : null,
      rpe: null,
      rir: input.rir,
      isWarmup: target.isWarmup,
      painLevel: null,
      performedAt: new Date().toISOString(),
    });

    // O recorde é avaliado ANTES de a série entrar na sessão: depois ela já faz
    // parte da base de comparação e nunca se superaria.
    const best = previousBestOneRepMax(previous, exercise.exerciseId);
    const beatsRecord =
      !target.isWarmup && !byTime && best > 0 && estimateOneRepMax(input.weight, input.reps) > best;

    log.mutate([set]);
    if (beatsRecord) {
      showToast(t('sessionNewRecord') + ' · ' + exercise.exerciseName);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRest(target.restSeconds);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.md },
        reference: { gap: spacing.sm },
        // Um campo por linha. Com o stepper redondo cada linha custa ~56 pt, e
        // os três campos cabem acima da dobra junto com o cabeçalho — que é o
        // que permite registrar uma série sem rolar a tela.
        fields: { gap: spacing.lg },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <View style={styles.reference}>
        <MetaChipRow>
          <MetaChip
            icon="target"
            label={
              t('sessionTargetLabel') +
              ': ' +
              (byTime
                ? (target.targetDurationSeconds ?? 0) + ' ' + t('secondsShort')
                : (target.targetReps ?? '—') +
                  (target.targetRepsMax ? '–' + target.targetRepsMax : '') +
                  ' ' +
                  t('repsShort'))
            }
          />
          {last ? (
            <MetaChip
              icon="clock"
              label={
                t('sessionLastTime') +
                ': ' +
                (last.weightKg ?? 0).toLocaleString('pt-BR') +
                ' kg × ' +
                (last.reps ?? last.durationSeconds ?? 0)
              }
            />
          ) : (
            <MetaChip icon="sparkles" label={t('sessionNoBaseline')} />
          )}
        </MetaChipRow>
        {completed.length ? (
          <Text variant="caption" tone="tertiary">
            {completed.length} {plural(completed.length, 'sessionSetDone', 'sessionSetsDone')}
          </Text>
        ) : null}
      </View>

      <View style={styles.fields}>
        <NumericStepper
          label={t('sessionLoad')}
          unit={t('unitKg')}
          value={input.weight}
          step={0.5}
          min={0}
          onChange={(weight) => change({ weight })}
        />
        {byTime ? (
          <NumericStepper
            label={t('sessionSeconds')}
            unit={t('secondsShort')}
            value={input.duration}
            min={0}
            onChange={(duration) => change({ duration })}
          />
        ) : (
          <NumericStepper
            label={t('sessionReps')}
            value={input.reps}
            min={0}
            onChange={(reps) => change({ reps })}
          />
        )}
        <NumericStepper
          label={t('sessionRir')}
          value={input.rir}
          min={0}
          max={10}
          onChange={(rir) => change({ rir })}
        />
      </View>

      <SessionControls
        onRecord={record}
        onPrevious={onPrevious}
        onNext={onNext}
        canPrevious={canPrevious}
        canNext={canNext}
      />
    </View>
  );
}
