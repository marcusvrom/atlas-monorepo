import { useReducer, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { GoalType, UpdatePlanInput, type WorkoutPlan, type WorkoutDay } from '@atlas/contracts';
import { useRouter, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  Screen,
  Sheet,
  Text,
} from '../../design/components';
import { newId } from '../../lib/id';
import { t } from '../../i18n';
import { usePlanActions } from './hooks';
import { addExercise, canPublish, emptyDay, moveExercise } from './editor-state';
import { PlanExerciseRow } from './PlanExerciseRow';
import { ExercisePicker } from './ExercisePicker';
import { PrescriptionEditor } from './PrescriptionEditor';
export function PlanEditor({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter(),
    navigation = useNavigation();
  const { update, publish } = usePlanActions();
  const [draft, change] = useReducer(
    (state: UpdatePlanInput, patch: Partial<UpdatePlanInput>) => ({ ...state, ...patch }),
    UpdatePlanInput.parse(plan),
  );
  const [saved, setSaved] = useState(JSON.stringify(draft));
  const [dayIndex, setDayIndex] = useState(0);
  const [picker, setPicker] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState<number | null>(null);
  const [validation, setValidation] = useState(false);
  const dirty = JSON.stringify(draft) !== saved;
  const day = draft.days[dayIndex];
  const busy = update.isPending || publish.isPending;
  usePreventRemove(dirty, ({ data }) =>
    Alert.alert(t('unsavedTitle'), t('unsavedDescription'), [
      { text: t('stay'), style: 'cancel' },
      { text: t('discard'), style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]),
  );
  const changeDay = (next: WorkoutDay) =>
    change({ days: draft.days.map((current, i) => (i === dayIndex ? next : current)) });
  const save = async (shouldPublish: boolean) => {
    const parsed = UpdatePlanInput.safeParse(draft);
    if (!parsed.success || (shouldPublish && !canPublish(draft))) {
      setValidation(true);
      return;
    }
    setValidation(false);
    try {
      const result = await update.mutateAsync({ id: plan.id, input: parsed.data });
      setSaved(JSON.stringify(UpdatePlanInput.parse(result)));
      if (shouldPublish) {
        await publish.mutateAsync(plan.id);
        router.replace({ pathname: '/plan/[id]', params: { id: plan.id } });
      }
    } catch {
      // ATL-PRG-002: os estados das mutations apresentam o erro e preservam o rascunho.
    }
  };
  return (
    <Screen>
      <FlashList
        data={day?.exercises ?? []}
        extraData={draft}
        keyExtractor={(item, index) => item.exerciseId + '-' + index}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label={t('back')} variant="ghost" onPress={() => router.back()} />
            <Text variant="title1" weight="bold">
              {t('planEditTitle')}
            </Text>
            <Input
              label={t('planName')}
              value={draft.name}
              onChangeText={(name) => change({ name })}
            />
            <View style={styles.row}>
              {GoalType.options.map((goal) => (
                <Chip
                  key={goal}
                  label={t(goal)}
                  selected={draft.goal === goal}
                  onPress={() => change({ goal })}
                />
              ))}
            </View>
            <View style={styles.row}>
              {draft.days.slice(0, 7).map((item, index) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={dayIndex === index}
                  onPress={() => setDayIndex(index)}
                />
              ))}
            </View>
            <Button
              label={t('planAddDay')}
              disabled={draft.days.length >= 7}
              onPress={() => {
                change({
                  days: [
                    ...draft.days,
                    emptyDay(
                      newId(),
                      draft.days.length,
                      t('planDay') + ' ' + (draft.days.length + 1),
                    ),
                  ],
                });
                setDayIndex(draft.days.length);
              }}
            />
            {day ? (
              <>
                <Input
                  label={t('planDayLabel')}
                  value={day.label}
                  onChangeText={(label) => changeDay({ ...day, label })}
                />
                <Button
                  label={t('planRemoveDay')}
                  variant="danger"
                  onPress={() =>
                    Alert.alert(t('planRemoveDay'), t('confirmRemoveDay'), [
                      { text: t('stay'), style: 'cancel' },
                      {
                        text: t('remove'),
                        style: 'destructive',
                        onPress: () => {
                          change({ days: draft.days.filter((_, i) => i !== dayIndex) });
                          setDayIndex(0);
                        },
                      },
                    ])
                  }
                />
                <Button label={t('planAddExercise')} onPress={() => setPicker(true)} />
              </>
            ) : null}
            {validation ? (
              <Text tone="danger" accessibilityRole="alert">
                {t('planPublishInvalid')}
              </Text>
            ) : null}
            {update.isError || publish.isError ? <ErrorState message={t('planSaveError')} /> : null}
            <Button label={t('save')} busy={busy} onPress={() => void save(false)} />
            <Button label={t('planPublish')} busy={busy} onPress={() => void save(true)} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('planEmptyDay')}
            description={t('planEmptyDayDescription')}
            actionLabel={t('planAddExercise')}
            onAction={() => {
              if (day) setPicker(true);
              else {
                change({ days: [emptyDay(newId(), 0, t('planDay') + ' 1')] });
                setDayIndex(0);
              }
            }}
          />
        }
        renderItem={({ item, index }) => (
          <PlanExerciseRow
            exercise={item}
            index={index}
            count={day!.exercises.length}
            onMove={(to) => changeDay(moveExercise(day!, index, to))}
            onRemove={() =>
              changeDay({
                ...day!,
                exercises: day!.exercises
                  .filter((_, i) => i !== index)
                  .map((ex, i) => ({ ...ex, order: i + 1 })),
              })
            }
            onEdit={() => setExerciseIndex(index)}
          />
        )}
      />
      <Sheet visible={picker} title={t('planAddExercise')} onClose={() => setPicker(false)}>
        <ExercisePicker
          onPick={(exercise) => {
            if (day)
              changeDay({
                ...day,
                exercises: [...day.exercises, addExercise(exercise, day.exercises.length + 1)],
              });
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet
        visible={exerciseIndex !== null}
        title={t('planSets')}
        onClose={() => setExerciseIndex(null)}
      >
        {exerciseIndex !== null && day?.exercises[exerciseIndex] ? (
          <PrescriptionEditor
            key={day.id + '-' + exerciseIndex}
            value={day.exercises[exerciseIndex]}
            onChange={(exercise) =>
              changeDay({
                ...day,
                exercises: day.exercises.map((current, i) =>
                  i === exerciseIndex ? exercise : current,
                ),
              })
            }
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.huge },
  header: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
