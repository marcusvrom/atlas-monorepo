import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { FlashList } from '@shopify/flash-list';
import type { ExerciseSummary } from '@atlas/contracts';
import { Input, LoadingState, ErrorState, EmptyState } from '../../design/components';
import { useDebouncedSearch } from '../catalog/use-debounced-search';
import { ExerciseRow } from '../catalog/ExerciseRow';
import { useExercisePages } from './hooks';
import { t } from '../../i18n';
export function ExercisePicker({ onPick }: { onPick: (exercise: ExerciseSummary) => void }) {
  const [search, setSearch] = useState('');
  const query = useDebouncedSearch(search);
  const results = useExercisePages({ query });
  return (
    <View style={styles.root}>
      <Input label={t('catalogSearch')} value={search} onChangeText={setSearch} />
      {results.isPending ? (
        <LoadingState />
      ) : results.isError ? (
        <ErrorState message={t('catalogError')} onRetry={() => void results.refetch()} />
      ) : (
        <View style={styles.list}>
          <FlashList
            data={results.data.pages.flatMap((p) => p.items)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ExerciseRow exercise={item} onPress={() => onPick(item)} />}
            onEndReached={() => {
              if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
            }}
            ListEmptyComponent={
              <EmptyState
                title={t('catalogEmptyTitle')}
                description={t('catalogEmptyDescription')}
                actionLabel={t('catalogClear')}
                onAction={() => setSearch('')}
              />
            }
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({ root: { gap: spacing.md }, list: { height: spacing.huge * 6 } });
