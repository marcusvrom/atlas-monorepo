import type { TodayWorkout } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { useRouter } from 'expo-router';
import { Card, Text, Button } from '../../design/components';
import { PrescriptionRow } from './PrescriptionRow';
import { t } from '../../i18n';
export function TodayExercises({ workout }: { workout: TodayWorkout }) {
  const router = useRouter();
  return (
    <Card>
      <Text variant="title2" weight="bold">
        {t('dashboardExercisesToday')}
      </Text>
      <View style={styles.list}>
        <FlashList
          data={workout.day.exercises}
          keyExtractor={(e) => e.exerciseId + '-' + e.order}
          renderItem={({ item }) => (
            <PrescriptionRow
              exercise={item}
              onPress={() =>
                router.push({ pathname: '/exercise/[id]', params: { id: item.exerciseId } })
              }
            />
          )}
        />
      </View>
      <Button
        variant="ghost"
        label={t('dashboardDayOpen')}
        onPress={() =>
          router.push({
            pathname: '/plan/[id]/day/[dayId]',
            params: { id: workout.planId, dayId: workout.day.id },
          })
        }
      />
    </Card>
  );
}
const styles = StyleSheet.create({ list: { height: spacing.huge * 4 } });
