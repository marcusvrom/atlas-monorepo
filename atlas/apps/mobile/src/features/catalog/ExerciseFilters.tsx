import { useState } from 'react';
import { Equipment, Difficulty, type ExerciseFilter } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import {
  Button,
  Chip,
  ErrorState,
  Input,
  LoadingState,
  Sheet,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useMuscleGroups } from './hooks';
import { equipmentLabel, difficultyLabel } from './labels';
export function ExerciseFilters({
  visible,
  filter,
  onChange,
  onClose,
}: {
  visible: boolean;
  filter: ExerciseFilter;
  onChange: (filter: ExerciseFilter) => void;
  onClose: () => void;
}) {
  const groups = useMuscleGroups();
  const [search, setSearch] = useState('');
  return (
    <Sheet visible={visible} title={t('catalogFilters')} onClose={onClose}>
      <Button label={t('catalogClear')} variant="ghost" onPress={() => onChange({})} />
      <Text weight="bold">{t('catalogEquipment')}</Text>
      <View style={styles.options}>
        {Equipment.options.map((value) => (
          <Chip
            key={value}
            label={equipmentLabel(value)}
            selected={filter.equipment === value}
            onPress={() =>
              onChange({ ...filter, equipment: filter.equipment === value ? undefined : value })
            }
          />
        ))}
      </View>
      <Text weight="bold">{t('catalogDifficulty')}</Text>
      <View style={styles.options}>
        {Difficulty.options.map((value) => (
          <Chip
            key={value}
            label={difficultyLabel(value)}
            selected={filter.difficulty === value}
            onPress={() =>
              onChange({ ...filter, difficulty: filter.difficulty === value ? undefined : value })
            }
          />
        ))}
      </View>
      <Input label={t('catalogMuscles')} value={search} onChangeText={setSearch} />
      {groups.isPending ? (
        <LoadingState lines={1} />
      ) : groups.isError ? (
        <ErrorState message={t('catalogError')} onRetry={() => void groups.refetch()} />
      ) : (
        <View style={styles.groups}>
          <FlashList
            data={groups.data?.filter((group) =>
              group.displayName
                .toLocaleLowerCase('pt-BR')
                .includes(search.toLocaleLowerCase('pt-BR')),
            )}
            keyExtractor={(item) => item.code}
            nestedScrollEnabled
            renderItem={({ item }) => (
              <Chip
                label={item.displayName}
                selected={filter.muscleCode === item.code}
                onPress={() =>
                  onChange({
                    ...filter,
                    muscleCode: filter.muscleCode === item.code ? undefined : item.code,
                  })
                }
              />
            )}
          />
        </View>
      )}
    </Sheet>
  );
}
const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  groups: { height: spacing.huge * 4 },
});
