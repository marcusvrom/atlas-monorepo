import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Screen,
  ScreenHeader,
  IconButton,
  LoadingState,
  ErrorState,
  EmptyState,
  Button,
} from '../../design/components';
import { HistoryRow } from './HistoryRow';
import { useHistoryPages } from '../../data/queries/dashboard';
import { t } from '../../i18n';
export function HistoryScreen() {
  const query = useHistoryPages(),
    router = useRouter();
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title={t('dashboardHistoryTitle')}
          leading={<IconButton icon="back" label={t('back')} onPress={() => router.back()} />}
        />
      </View>
      {query.isPending ? (
        <LoadingState />
      ) : (
        <FlashList
          data={query.data?.pages.flatMap((p) => p.items) ?? []}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError)
              void query.fetchNextPage();
          }}
          ListHeaderComponent={
            query.isError && !query.data ? (
              <ErrorState message={t('progressError')} onRetry={() => void query.refetch()} />
            ) : null
          }
          ListEmptyComponent={
            !query.isError ? (
              <EmptyState
                title={t('dashboardHistoryEmpty')}
                description={t('dashboardHistoryBody')}
                actionLabel={t('plans')}
                onAction={() => router.push('/(tabs)/plans')}
              />
            ) : null
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <LoadingState lines={1} />
            ) : query.isFetchNextPageError ? (
              <ErrorState message={t('progressError')} onRetry={() => void query.fetchNextPage()} />
            ) : query.hasNextPage ? (
              <Button label={t('catalogMore')} onPress={() => void query.fetchNextPage()} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <HistoryRow
                session={item}
                onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
              />
            </View>
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset },
  list: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
  item: { paddingBottom: spacing.md },
});
