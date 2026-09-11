import { useMemo, useState } from 'react';
import type { ExerciseFilter } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  ScreenHeader,
  IconButton,
} from '../../design/components';
import { t } from '../../i18n';
import { useExercisePages } from './hooks';
import { useDebouncedSearch } from './use-debounced-search';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseRow } from './ExerciseRow';
export function ExerciseCatalogScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useDebouncedSearch(search);
  const [filter, setFilter] = useState<ExerciseFilter>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const result = useExercisePages({ ...filter, query, limit: 20 });
  const items = useMemo(
    () => result.data?.pages.flatMap((page) => page.items) ?? [],
    [result.data],
  );
  const clear = () => {
    setSearch('');
    setFilter({});
  };
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title={t('catalogTitle')}
          subtitle={t('catalogSubtitle')}
          leading={<IconButton icon="back" label={t('back')} onPress={() => router.back()} />}
          action={
            <IconButton
              icon="filter"
              label={t('catalogFilters')}
              onPress={() => setFiltersOpen(true)}
            />
          }
        />
        <Input label={t('catalogSearch')} value={search} onChangeText={setSearch} />
      </View>
      {result.isPending ? (
        <LoadingState />
      ) : (
        <FlashList
          data={items}
          contentContainerStyle={styles.content}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseRow
              exercise={item}
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.id } })}
            />
          )}
          ListHeaderComponent={
            result.isError ? (
              <ErrorState message={t('catalogError')} onRetry={() => void result.refetch()} />
            ) : null
          }
          ListEmptyComponent={
            !result.isError ? (
              <EmptyState
                title={t('catalogEmptyTitle')}
                description={t('catalogEmptyDescription')}
                actionLabel={t('catalogClear')}
                onAction={clear}
              />
            ) : null
          }
          onEndReached={() => {
            if (result.hasNextPage && !result.isFetchingNextPage && !result.isFetchNextPageError)
              void result.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            result.isFetchingNextPage ? (
              <LoadingState lines={1} />
            ) : result.isFetchNextPageError ? (
              <ErrorState message={t('catalogError')} onRetry={() => void result.fetchNextPage()} />
            ) : result.hasNextPage ? (
              <Button label={t('catalogMore')} onPress={() => void result.fetchNextPage()} />
            ) : null
          }
        />
      )}
      <ExerciseFilters
        visible={filtersOpen}
        filter={filter}
        onChange={setFilter}
        onClose={() => setFiltersOpen(false)}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset, gap: spacing.sm },
  content: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
});
