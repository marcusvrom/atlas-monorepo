import { useState, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Modality, Specialty, type ProfessionalSearchFilter } from '@atlas/contracts';
import { useRouter } from 'expo-router';
import { layout, spacing } from '@atlas/design-tokens';
import {
  ScreenHeader,
  IconButton,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  MetaChip,
  MetaChipRow,
  PersonAvatar,
  Screen,
  Sheet,
  Text,
} from '../../design/components';
import { formatCount, formatCurrency, formatEffort } from '../../lib/format';
import { t } from '../../i18n';
import { useDebouncedSearch } from '../catalog/use-debounced-search';
import { useProfessionalPages } from './hooks';
export function MarketplaceScreen() {
  const router = useRouter();
  const [search, setSearch] = useState(''),
    [open, setOpen] = useState(false);
  const [filter, change] = useReducer(
    (state: ProfessionalSearchFilter, patch: Partial<ProfessionalSearchFilter>) => ({
      ...state,
      ...patch,
    }),
    {},
  );
  const query = useDebouncedSearch(search);
  const results = useProfessionalPages({ ...filter, query });
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          title={t('marketplaceTitle')}
          subtitle={t('marketplaceSubtitle')}
          action={
            <IconButton icon="filter" label={t('catalogFilters')} onPress={() => setOpen(true)} />
          }
        />
        <Input label={t('professionalSearch')} value={search} onChangeText={setSearch} />
      </View>
      {results.isPending ? (
        <LoadingState />
      ) : results.isError ? (
        <ErrorState message={t('coachError')} onRetry={() => void results.refetch()} />
      ) : (
        <FlashList
          data={results.data.pages.flatMap((page) => page.items)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
          }}
          ListEmptyComponent={
            <EmptyState
              title={t('professionalEmpty')}
              description={t('professionalEmptyDescription')}
              actionLabel={t('catalogClear')}
              onAction={() => {
                setSearch('');
                change({
                  specialty: undefined,
                  modality: undefined,
                  maxDistanceKm: undefined,
                  maxPriceBrl: undefined,
                });
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Card>
                {/* Retrato + nome + nota numa linha só: é a primeira coisa que
                    o usuário compara entre profissionais, e antes disso estava
                    espalhado por três blocos de texto. */}
                <View style={styles.cardHead}>
                  <PersonAvatar id={item.id} name={item.displayName} uri={item.avatarUrl} />
                  <View style={styles.cardName}>
                    <Text variant="title3" weight="bold" numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    <Text tone="brand" weight="semibold" variant="footnote">
                      {item.credentialLabel}
                    </Text>
                  </View>
                  <Badge label={`★ ${formatEffort(item.rating)}`} tone="warning" />
                </View>
                <Text>{item.headline}</Text>
                <MetaChipRow>
                  <MetaChip icon="person" label={t(item.modality)} />
                  <MetaChip icon="target" label={item.city} />
                  <MetaChip
                    icon="check"
                    label={formatCount(item.reviewCount) + ' ' + t('reviews')}
                  />
                </MetaChipRow>
                <Text weight="bold">
                  {formatCurrency(item.monthlyPriceBrl)}{' '}
                  <Text tone="secondary">/ {t('month')}</Text>
                </Text>
                <Button
                  variant="ghost"
                  label={t('professionalOpen')}
                  onPress={() =>
                    router.push({ pathname: '/professional/[id]', params: { id: item.id } })
                  }
                />
              </Card>
            </View>
          )}
        />
      )}
      <Sheet visible={open} title={t('catalogFilters')} onClose={() => setOpen(false)}>
        <View style={styles.options}>
          {Specialty.options.map((specialty) => (
            <Chip
              key={specialty}
              label={t(specialty)}
              selected={filter.specialty === specialty}
              onPress={() =>
                change({ specialty: filter.specialty === specialty ? undefined : specialty })
              }
            />
          ))}
          {Modality.options.map((modality) => (
            <Chip
              key={modality}
              label={t(modality)}
              selected={filter.modality === modality}
              onPress={() =>
                change({ modality: filter.modality === modality ? undefined : modality })
              }
            />
          ))}
        </View>
        <Input
          label={t('maxPrice')}
          keyboardType="decimal-pad"
          value={filter.maxPriceBrl?.toString() ?? ''}
          onChangeText={(value) =>
            change({ maxPriceBrl: Number(value) > 0 ? Number(value) : undefined })
          }
        />
        <Input
          label={t('maxDistance')}
          keyboardType="decimal-pad"
          value={filter.maxDistanceKm?.toString() ?? ''}
          onChangeText={(value) =>
            change({ maxDistanceKm: Number(value) > 0 ? Number(value) : undefined })
          }
        />
      </Sheet>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: layout.pageInset, gap: spacing.md },
  list: { padding: layout.pageInset, paddingBottom: spacing.huge * 2 },
  item: { paddingBottom: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardName: { flex: 1, gap: spacing.xxs },
});
