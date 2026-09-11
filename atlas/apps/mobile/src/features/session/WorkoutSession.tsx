import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useKeepAwake } from 'expo-keep-awake';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout, spacing } from '@atlas/design-tokens';
import type { TrainingSession } from '@atlas/contracts';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
  Text,
} from '../../design/components';
import { notifyAfterRest } from '../../data/rest-notification';
import { plural, t } from '../../i18n';
import {
  useRestDeadline,
  useCompleteSession,
  useLastSession,
  usePlan,
  useSessionQueue,
} from './hooks';
import { SessionHeader } from './SessionHeader';
import { SetRecorder } from './SetRecorder';
import { SetRow } from './SetRow';
import { SessionSummary } from './SessionSummary';
import { recordSetIds } from './session-summary';

/**
 * ATL-SES-005 — a tela de execução.
 *
 * Reescrita da composição. A versão anterior era uma `FlashList` de séries com
 * o registrador preso em 65 % da altura por baixo: o cabeçalho rolava junto com
 * a lista, o registrador não, e no meio ficava um bloco fixo com três campos
 * empilhados. Na prática o usuário via três steppers e pouco mais — sem saber
 * em que exercício estava, quantas séries faltavam ou o que tinha levantado da
 * última vez.
 *
 * Agora é uma coluna só: cabeçalho com identidade e progresso, registrador
 * compacto, e as séries já feitas embaixo. `ScrollView` e não `FlashList` de
 * propósito — a lista aqui é do tamanho da prescrição (3 a 6 itens), e
 * virtualizar isso custava mais em complexidade de layout do que rendia.
 */
export function WorkoutSession({ session }: { session: TrainingSession }) {
  useKeepAwake();
  const router = useRouter(),
    navigation = useNavigation(),
    insets = useSafeAreaInsets();
  const plan = usePlan(session.planId ?? undefined);
  const last = useLastSession(session.planId, session.dayLabel);
  const queue = useSessionQueue(session.id);
  const finish = useCompleteSession();
  const [index, setIndex] = useState(0);
  const { deadline, set: setDeadline } = useRestDeadline(session.id);
  const [allowExit, setAllowExit] = useState(false);

  const day = plan.data?.days.find((item) => item.label === session.dayLabel);
  const exercises = day?.exercises ?? [];
  const exercise = exercises[index];
  const performed = useMemo(
    () => session.sets.filter((set) => set.exerciseId === exercise?.exerciseId),
    [session.sets, exercise?.exerciseId],
  );
  const records = useMemo(() => recordSetIds(session, last.data ?? null), [session, last.data]);
  const restSeconds =
    exercise?.sets[Math.min(performed.length, exercise.sets.length - 1)]?.restSeconds ?? 60;

  usePreventRemove(!allowExit && session.status === 'inProgress', ({ data }) =>
    Alert.alert(t('sessionExitTitle'), t('sessionExitDescription'), [
      { text: t('stay'), style: 'cancel' },
      {
        text: t('sessionExit'),
        onPress: () => {
          setAllowExit(true);
          navigation.dispatch(data.action);
        },
      },
    ]),
  );

  const move = (offset: number) =>
    setIndex((current) => Math.max(0, Math.min(exercises.length - 1, current + offset)));

  const swipe = Gesture.Pan()
    .activeOffsetX([-spacing.xxl, spacing.xxl])
    .failOffsetY([-spacing.lg, spacing.lg])
    .onEnd((event) => {
      if (Math.abs(event.translationX) > spacing.huge)
        scheduleOnRN(move, event.translationX < 0 ? 1 : -1);
    });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: layout.pageInset,
          paddingBottom: insets.bottom + spacing.huge,
          gap: layout.sectionGap,
        },
        section: { gap: spacing.sm },
        notices: { gap: spacing.sm },
      }),
    [insets.bottom],
  );

  if (session.status === 'completed')
    return (
      <Screen>
        <ScrollView>
          <SessionSummary
            session={session}
            previous={last.data ?? null}
            onClose={() => router.replace('/(tabs)')}
          />
        </ScrollView>
      </Screen>
    );

  if (plan.isPending)
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );

  if (!exercise)
    return (
      <Screen>
        <EmptyState
          title={t('sessionNoPrescription')}
          description={t('sessionChoosePlan')}
          actionLabel={t('sessionExit')}
          onAction={() => router.back()}
        />
      </Screen>
    );

  return (
    <Screen edges={['top']}>
      <GestureDetector gesture={swipe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <SessionHeader
            exercise={exercise}
            dayLabel={session.dayLabel}
            exerciseIndex={index}
            exerciseCount={exercises.length}
            setIndex={performed.length}
            setCount={exercise.sets.length}
            restDeadline={deadline}
            restSeconds={restSeconds}
            onBack={() => router.back()}
            onGuide={() =>
              router.push({
                pathname: '/exercise/[id]',
                params: { id: exercise.exerciseId },
              })
            }
          />

          <SetRecorder
            key={exercise.exerciseId + '-' + index + '-' + session.sets.length}
            session={session}
            exercise={exercise}
            previous={last.data ?? null}
            onRest={(seconds) => {
              setDeadline(Date.now() + seconds * 1000);
              void notifyAfterRest(seconds);
            }}
            onPrevious={() => move(-1)}
            onNext={() => move(1)}
            canPrevious={index > 0}
            canNext={index < exercises.length - 1}
          />

          <View style={styles.section}>
            <SectionHeader title={t('dashboardSets')} />
            {performed.length ? (
              performed.map((set, position) => (
                <SetRow
                  key={set.clientGeneratedId}
                  set={set}
                  order={position + 1}
                  isRecord={records.has(set.clientGeneratedId)}
                />
              ))
            ) : (
              <Text tone="secondary">{t('sessionNoSets')}</Text>
            )}
          </View>

          {/* Concluir o treino acontece uma vez, no fim — então mora no fim da
              tela, depois das séries registradas. No cluster de controles ele
              disputava atenção com "Concluir série" a cada repetição. */}
          <Button
            label={t('sessionFinishWorkout')}
            variant="ghost"
            icon="check"
            busy={finish.isPending}
            onPress={() => finish.mutate(session.id)}
          />

          {/* Avisos de fila e erro ficam no fim: são importantes quando
              acontecem e ruído visual quando não. */}
          <View style={styles.notices}>
            {queue.pending ? (
              <Text accessibilityLiveRegion="polite" tone="secondary">
                {queue.pending} {plural(queue.pending, 'sessionPendingOne', 'sessionPending')}
              </Text>
            ) : null}
            {queue.pending ? (
              <Button
                label={t('retry')}
                busy={queue.retry.isPending}
                variant="ghost"
                onPress={() => queue.retry.mutate()}
              />
            ) : null}
            {queue.rejected ? (
              <Text tone="warning">
                {queue.rejected} {plural(queue.rejected, 'sessionRejectedOne', 'sessionRejected')}
              </Text>
            ) : null}
            {plan.isError ? (
              <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
            ) : null}
            {last.isError ? <Text tone="secondary">{t('sessionPreviousUnavailable')}</Text> : null}
            {finish.isError ? <ErrorState message={t('sessionFinishError')} /> : null}
          </View>
        </ScrollView>
      </GestureDetector>
    </Screen>
  );
}
