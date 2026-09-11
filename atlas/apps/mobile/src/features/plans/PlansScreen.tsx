import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  ScreenHeader,
  IconButton,
} from '../../design/components';
import { t } from '../../i18n';
import { usePlanPages } from './hooks';
import { PlanCard } from './PlanCard';
export function PlansScreen() {
  const router = useRouter(),
    plans = usePlanPages();
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title={t('plans')}
          subtitle={t('plansSubtitle')}
          action={
            <IconButton icon="plus" label={t('newPlan')} onPress={() => router.push('/plan/new')} />
          }
        />
      </View>
      {plans.isPending ? (
        <LoadingState />
      ) : plans.isError ? (
        <ErrorState message={t('planLoadError')} onRetry={() => void plans.refetch()} />
      ) : (
        <FlashList
          data={plans.data.pages.flatMap((page) => page.items)}
          contentContainerStyle={styles.list}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (plans.hasNextPage && !plans.isFetchingNextPage) void plans.fetchNextPage();
          }}
          ListFooterComponent={plans.isFetchingNextPage ? <LoadingState lines={1} /> : null}
          ListEmptyComponent={
            <EmptyState
              title={t('planEmptyTitle')}
              description={t('planEmptyDescription')}
              actionLabel={t('newPlan')}
              onAction={() => router.push('/plan/new')}
            />
          }
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset, gap: spacing.md },
  list: { paddingHorizontal: layout.pageInset, paddingBottom: spacing.huge * 2 },
  item: { paddingBottom: spacing.md },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
