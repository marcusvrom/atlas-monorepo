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
  Chip,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
  IconButton,
} from '../../design/components';
import { assessExercise } from '@atlas/domain';
import { difficultyLabel, equipmentLabel } from './labels';
import { t } from '../../i18n';
import { useExercisePages } from './hooks';
import { useDebouncedSearch } from './use-debounced-search';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseRow } from './ExerciseRow';
import { usePersonalizedFilter } from './use-personalized-filter';
export function ExerciseCatalogScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const query = useDebouncedSearch(search);
  const [filter, setFilter] = useState<ExerciseFilter>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Ligado por padrão quando há perfil: quem respondeu "poupe meu joelho"
  // espera que o app se lembre disso. O que não pode é acontecer em silêncio —
  // daí o interruptor e a frase abaixo dele.
  const [personalized, setPersonalized] = useState(true);
  const profile = usePersonalizedFilter(personalized);
  const result = useExercisePages({ ...filter, ...profile.filter, query, limit: 20 });
  const items = useMemo(
    () => result.data?.pages.flatMap((page) => page.items) ?? [],
    [result.data],
  );
  // O veredito é calculado sobre a lista já carregada — inclusive com o filtro
  // desligado, que é justamente quando o selo precisa aparecer.
  const fits = useMemo(
    () => new Map(items.map((item) => [item.id, assessExercise(item, profile.preferences)])),
    [items, profile.preferences],
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
        {profile.available ? (
          <View style={styles.personalized}>
            <Chip
              label={t('catalogPersonalized')}
              selected={personalized}
              onPress={() => setPersonalized(!personalized)}
            />
            <Text variant="footnote" tone="secondary" style={styles.personalizedHint}>
              {t(personalized ? 'catalogPersonalizedOn' : 'catalogPersonalizedOff')}
            </Text>
          </View>
        ) : null}
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
              fit={profile.preferences ? fits.get(item.id) : undefined}
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
              // Lista vazia por causa do perfil tem saída própria: mandar
              // "limpar busca" a quem não buscou nada não resolve nada.
              personalized && profile.available && !query ? (
                <EmptyState
                  title={t('catalogPersonalizedEmpty')}
                  description={t('catalogPersonalizedEmptyHint')}
                  actionLabel={t('catalogPersonalized')}
                  onAction={() => setPersonalized(false)}
                />
              ) : (
                <EmptyState
                  title={t('catalogEmptyTitle')}
                  description={t('catalogEmptyDescription')}
                  actionLabel={t('catalogClear')}
                  onAction={clear}
                />
              )
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
  personalized: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  // A frase precisa poder ocupar duas linhas ao lado do chip num aparelho
  // estreito, em vez de ser truncada — é ela que explica o que sumiu da lista.
  personalizedHint: { flex: 1, minWidth: layout.stepperValue },
  content: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
  listHeader: { gap: layout.sectionGap },
  featured: { gap: spacing.md },
  // O trilho precisa sangrar até a borda da tela, mas vive dentro de uma lista
  // que já tem recuo lateral: a margem negativa devolve exatamente esse recuo.
  bleed: { marginHorizontal: -layout.pageInset },
  card: { width: layout.carouselItem },
});
