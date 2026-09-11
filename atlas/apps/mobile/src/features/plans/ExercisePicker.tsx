import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { FlashList } from '@shopify/flash-list';
import type { ExerciseSummary } from '@atlas/contracts';
import { Input, LoadingState, ErrorState, EmptyState } from '../../design/components';
import { assessExercise, rankByFit } from '@atlas/domain';
import { useDebouncedSearch } from '../catalog/use-debounced-search';
import { ExerciseRow } from '../catalog/ExerciseRow';
import { usePersonalizedFilter } from '../catalog/use-personalized-filter';
import { useExercisePages } from './hooks';
import { t } from '../../i18n';

/**
 * Escolha de exercício ao montar uma ficha.
 *
 * Aqui a personalização **ordena, mas não esconde** — ao contrário do catálogo,
 * onde o filtro pode ser ligado. Montar ficha é a hora em que o usuário pode
 * legitimamente querer o exercício que ele mesmo marcou para poupar (por
 * orientação de um profissional, por exemplo), e sumir com ele forçaria uma ida
 * ao perfil para desfazer a preferência. O que o app faz é pôr as boas opções
 * na frente e marcar as que pedem atenção — a decisão continua sendo de quem
 * monta.
 */
export function ExercisePicker({ onPick }: { onPick: (exercise: ExerciseSummary) => void }) {
  const [search, setSearch] = useState('');
  const query = useDebouncedSearch(search);
  const results = useExercisePages({ query });
  const profile = usePersonalizedFilter(false);
  const items = useMemo(() => {
    const all = results.data?.pages.flatMap((page) => page.items) ?? [];
    return rankByFit(all, profile.preferences).map((entry) => entry.exercise);
  }, [results.data, profile.preferences]);
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
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ExerciseRow
                exercise={item}
                fit={profile.preferences ? assessExercise(item, profile.preferences) : undefined}
                onPress={() => onPick(item)}
              />
            )}
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
