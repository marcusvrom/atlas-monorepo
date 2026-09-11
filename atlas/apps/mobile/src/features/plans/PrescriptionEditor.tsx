import type { ExercisePrescription, SetPrescription } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Button, Chip, Input, NumericStepper, Text } from '../../design/components';
import { t } from '../../i18n';
import { defaultSet } from './editor-state';
import { useState } from 'react';
export function PrescriptionEditor({
  value,
  onChange,
}: {
  value: ExercisePrescription;
  onChange: (value: ExercisePrescription) => void;
}) {
  const [index, setIndex] = useState(0);
  const selected = value.sets[Math.min(index, value.sets.length - 1)]!;
  const change = (patch: Partial<SetPrescription>) =>
    onChange({
      ...value,
      sets: value.sets.map((set, i) =>
        i === Math.min(index, value.sets.length - 1) ? { ...set, ...patch } : set,
      ),
    });
  return (
    <View style={styles.root}>
      <Text weight="bold">{value.exerciseName}</Text>
      <View style={styles.row}>
        {(['straight', 'superset', 'dropset'] as const).map((technique) => (
          <Chip
            key={technique}
            label={t(
              technique === 'straight'
                ? 'techniqueStraight'
                : technique === 'superset'
                  ? 'techniqueSuperset'
                  : 'techniqueDropset',
            )}
            selected={value.technique === technique}
            onPress={() =>
              onChange({
                ...value,
                technique,
                supersetGroup: technique === 'superset' ? 'A' : null,
              })
            }
          />
        ))}
      </View>
      {value.technique === 'superset' ? (
        <Input
          label={t('supersetGroup')}
          value={value.supersetGroup ?? ''}
          onChangeText={(supersetGroup) => onChange({ ...value, supersetGroup })}
        />
      ) : null}
      <NumericStepper
        label={t('planSetNumber')}
        value={index + 1}
        min={1}
        max={value.sets.length}
        onChange={(number) => setIndex(number - 1)}
      />
      <NumericStepper
        label={t('planRepsMin')}
        value={selected.targetReps ?? 1}
        min={1}
        onChange={(targetReps) =>
          change({
            targetReps,
            targetRepsMax: Math.max(targetReps, selected.targetRepsMax ?? targetReps),
          })
        }
      />
      <NumericStepper
        label={t('planRepsMax')}
        value={selected.targetRepsMax ?? selected.targetReps ?? 1}
        min={selected.targetReps ?? 1}
        onChange={(targetRepsMax) => change({ targetRepsMax })}
      />
      <NumericStepper
        label={t('planWeight')}
        unit={t('unitKg')}
        value={selected.targetWeightKg ?? 0}
        min={0}
        step={0.5}
        onChange={(targetWeightKg) => change({ targetWeightKg })}
      />
      <NumericStepper
        label={t('planRir')}
        value={selected.targetRir ?? 0}
        min={0}
        max={10}
        onChange={(targetRir) => change({ targetRir })}
      />
      <NumericStepper
        label={t('planRest')}
        value={selected.restSeconds}
        min={0}
        step={5}
        onChange={(restSeconds) => change({ restSeconds })}
      />
      <Button
        label={t('planAddSet')}
        onPress={() => {
          onChange({
            ...value,
            sets: [
              ...value.sets,
              { ...defaultSet(value.sets.length + 1), ...selected, order: value.sets.length + 1 },
            ],
          });
          setIndex(value.sets.length);
        }}
      />
      <Button
        label={t('planRemoveSet')}
        variant="danger"
        disabled={value.sets.length === 1}
        onPress={() => {
          onChange({
            ...value,
            sets: value.sets
              .filter((_, i) => i !== index)
              .map((set, i) => ({ ...set, order: i + 1 })),
          });
          setIndex(Math.max(0, index - 1));
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  root: { gap: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
