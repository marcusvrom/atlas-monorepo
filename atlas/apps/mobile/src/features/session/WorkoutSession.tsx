import { useState, useMemo } from 'react';
import { Alert, StyleSheet, View, ScrollView } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useKeepAwake } from 'expo-keep-awake';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { spacing } from '@atlas/design-tokens';
import type { TrainingSession } from '@atlas/contracts';
import {
  Button,
  EmptyState,
  ErrorState,
  ScreenHeader,
  IconButton,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
import { notifyAfterRest } from '../../data/rest-notification';
import { t } from '../../i18n';
import {
  useRestDeadline,
  useCompleteSession,
  useLastSession,
  usePlan,
  useSessionQueue,
} from './hooks';
import { RestTimer } from './RestTimer';
import { SetRecorder } from './SetRecorder';
import { SessionSummary } from './SessionSummary';
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
  const exercise = day?.exercises[index];
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
    setIndex((current) =>
      Math.max(0, Math.min((day?.exercises.length ?? 1) - 1, current + offset)),
    );
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
        root: { flex: 1 },
        list: { padding: spacing.lg, paddingBottom: spacing.huge },
        header: { gap: spacing.md },

        recorder: {
          height: '65%',
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.sm,
        },
        set: { paddingVertical: spacing.sm },
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
  return (
    <Screen edges={['top']}>
      <GestureDetector gesture={swipe}>
        <View style={styles.root}>
          <FlashList
            data={session.sets.filter((set) => set.exerciseId === exercise?.exerciseId)}
            keyExtractor={(set) => set.clientGeneratedId}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <View style={styles.header}>
                <ScreenHeader
                  title={exercise?.exerciseName ?? session.dayLabel}
                  subtitle={session.dayLabel}
                  leading={
                    <IconButton
                      icon="back"
                      label={t('sessionExit')}
                      onPress={() => router.back()}
                    />
                  }
                />
                <RestTimer deadline={deadline} />
                {exercise ? (
                  <Button
                    variant="ghost"
                    label={t('dashboardExerciseGuide')}
                    onPress={() =>
                      router.push({
                        pathname: '/exercise/[id]',
                        params: { id: exercise.exerciseId },
                      })
                    }
                  />
                ) : null}
                {queue.pending ? (
                  <Text accessibilityLiveRegion="polite">
                    {queue.pending} {t('sessionPending')}
                  </Text>
                ) : null}
                {queue.rejected ? (
                  <Text tone="warning">
                    {queue.rejected} {t('sessionRejected')}
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
                {plan.isPending ? (
                  <LoadingState lines={1} />
                ) : plan.isError ? (
                  <ErrorState message={t('planLoadError')} onRetry={() => void plan.refetch()} />
                ) : null}
                {last.isError ? (
                  <Text tone="secondary">{t('sessionPreviousUnavailable')}</Text>
                ) : null}
                {finish.isError ? <ErrorState message={t('sessionFinishError')} /> : null}
              </View>
            }
            ListEmptyComponent={<Text>{t('sessionNoSets')}</Text>}
            renderItem={({ item }) => (
              <View style={styles.set}>
                <Text>
                  {t('planSetNumber')} {item.order}: {item.weightKg ?? 0} kg ×{' '}
                  {item.reps ?? item.durationSeconds ?? 0}
                  {item.reps === null ? ' ' + t('sessionSeconds') : ''}
                </Text>
              </View>
            )}
          />
        </View>
      </GestureDetector>
      {exercise ? (
        <View style={styles.recorder}>
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
            onFinish={() => finish.mutate(session.id)}
          />
        </View>
      ) : !plan.isPending ? (
        <EmptyState
          title={t('sessionNoPrescription')}
          description={t('sessionChoosePlan')}
          actionLabel={t('sessionExit')}
          onAction={() => router.back()}
        />
      ) : null}
    </Screen>
  );
}
