import { StyleSheet, View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { layout, spacing } from '@atlas/design-tokens';
import {
  Screen,
  ScreenHeader,
  IconButton,
  Card,
  Text,
  LoadingState,
  ErrorState,
  EmptyState,
  Button,
} from '../../design/components';
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
            <Pressable
              style={styles.item}
              accessibilityRole="button"
              accessibilityLabel={
                item.dayLabel + ' ' + new Date(item.startedAt).toLocaleDateString('pt-BR')
              }
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
            >
              <Card>
                <Text variant="footnote" tone="secondary">
                  {new Date(item.startedAt).toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
                <Text variant="caption" tone="secondary">
                  {t(
                    item.status === 'completed'
                      ? 'historyCompleted'
                      : item.status === 'inProgress'
                        ? 'historyInProgress'
                        : 'historyAbandoned',
                  )}
                </Text>
                <Text variant="title2" weight="bold">
                  {item.dayLabel}
                </Text>
                <Text variant="subhead" tone="secondary">
                  {Math.round(item.durationSeconds / 60)} {t('minutesShort')} · {item.setCount}{' '}
                  {t('dashboardSets').toLowerCase()} · {item.totalVolumeKg.toLocaleString('pt-BR')}{' '}
                  {t('kilogramsShort')}
                </Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset },
  list: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge },
  item: { paddingBottom: spacing.lg },
});
