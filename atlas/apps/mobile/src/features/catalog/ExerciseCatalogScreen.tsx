import { useMemo, useState } from 'react';
import type { ExerciseFilter } from '@atlas/contracts';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Button,
  Carousel,
  CoverCard,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  MetaChip,
  MetaChipRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  IconButton,
} from '../../design/components';
import { difficultyLabel, equipmentLabel } from './labels';
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

  // O trilho de destaque some assim que há busca ou filtro: com resultado
  // filtrado ele repetiria as primeiras linhas da própria lista, roubando a
  // primeira tela de quem já sabe o que procura.
  const browsing = !query && !Object.values(filter).some(Boolean);
  const featured = browsing ? items.slice(0, FEATURED_SIZE) : [];
  // A lista continua de onde a vitrine parou. Mostrar os mesmos seis
  // exercícios duas vezes seguidas gastava a primeira tela repetindo o que o
  // usuário acabou de ver — e fazia o catálogo parecer menor do que é.
  const rest = browsing ? items.slice(FEATURED_SIZE) : items;
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
          data={rest}
          contentContainerStyle={styles.content}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseRow
              exercise={item}
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.id } })}
            />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {result.isError ? (
                <ErrorState message={t('catalogError')} onRetry={() => void result.refetch()} />
              ) : null}
              {featured.length ? (
                <View style={styles.featured}>
                  <SectionHeader title={t('catalogFeatured')} subtitle={t('catalogFeaturedHint')} />
                  <View style={styles.bleed}>
                    <Carousel itemWidth={layout.carouselItem} label={t('catalogFeatured')}>
                      {featured.map((exercise) => (
                        <CoverCard
                          key={exercise.id}
                          seed={exercise.id}
                          uri={exercise.thumbnailUrl}
                          glyph="dumbbell"
                          height={layout.coverCard}
                          style={styles.card}
                          showPlay
                          title={exercise.name}
                          eyebrow={equipmentLabel(exercise.equipment)}
                          meta={
                            <MetaChipRow>
                              <MetaChip
                                onCover
                                icon="target"
                                label={difficultyLabel(exercise.difficulty)}
                              />
                            </MetaChipRow>
                          }
                          onPress={() =>
                            router.push({
                              pathname: '/exercise/[id]',
                              params: { id: exercise.id },
                            })
                          }
                        />
                      ))}
                    </Carousel>
                  </View>
                  <SectionHeader title={t('catalogBrowse')} />
                </View>
              ) : null}
            </View>
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
/** Quantos exercícios entram na vitrine antes da lista completa. */
const FEATURED_SIZE = 6;

const styles = StyleSheet.create({
  header: { padding: layout.pageInset, gap: spacing.sm },
  content: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
  listHeader: { gap: layout.sectionGap },
  featured: { gap: spacing.md },
  // O trilho precisa sangrar até a borda da tela, mas vive dentro de uma lista
  // que já tem recuo lateral: a margem negativa devolve exatamente esse recuo.
  bleed: { marginHorizontal: -layout.pageInset },
  card: { width: layout.carouselItem },
});
