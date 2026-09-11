import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { spacing } from '@atlas/design-tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  Text,
} from '../../design/components';
import { t } from '../../i18n';
import { useClients } from './hooks';
export function ClientPanel() {
  const router = useRouter();
  const [search, setSearch] = useState(''),
    [risk, setRisk] = useState(false);
  const clients = useClients('risk');
  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="display" weight="bold">
          {t('clientsTitle')}
        </Text>
        <Input label={t('clientSearch')} value={search} onChangeText={setSearch} />
        <Chip label={t('clientsAtRisk')} selected={risk} onPress={() => setRisk(!risk)} />
      </View>
      {clients.isPending ? (
        <LoadingState />
      ) : clients.isError ? (
        <ErrorState message={t('coachError')} onRetry={() => void clients.refetch()} />
      ) : (
        <FlashList
          data={clients.data.filter(
            (client) =>
              (!risk || client.riskScore >= 0.7) &&
              client.displayName
                .toLocaleLowerCase('pt-BR')
                .includes(search.toLocaleLowerCase('pt-BR')),
          )}
          contentContainerStyle={styles.list}
          keyExtractor={(item) => item.athleteId}
          ListEmptyComponent={
            <EmptyState
              title={t('clientEmpty')}
              description={t('professionalEmptyDescription')}
              actionLabel={t('catalogClear')}
              onAction={() => {
                setSearch('');
                setRisk(false);
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Card>
                <View style={styles.cardHead}>
                  <Text variant="title3" weight="bold" style={styles.cardName}>
                    {item.displayName}
                  </Text>
                  {item.riskScore >= 0.7 ? (
                    <Badge label={t('needsAttention')} tone="danger" />
                  ) : null}
                </View>
                <Text tone="secondary">{t(item.goal)}</Text>
                <Button
                  variant="ghost"
                  label={t('open')}
                  onPress={() =>
                    router.push({ pathname: '/client/[id]', params: { id: item.athleteId } })
                  }
                />
              </Card>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: spacing.lg, gap: spacing.md },
  list: { padding: spacing.lg, paddingBottom: spacing.huge * 2 },
  item: { paddingBottom: spacing.md },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardName: { flex: 1 },
});
