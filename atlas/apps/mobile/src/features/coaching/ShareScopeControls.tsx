import { ShareScope, type ClientDetail } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Card, Chip, ErrorState, Text } from '../../design/components';
import { t } from '../../i18n';
import { useUpdateShareScope } from './hooks';
export function ShareScopeControls({ detail }: { detail: ClientDetail }) {
  const save = useUpdateShareScope(detail.overview.athleteId);
  return (
    <Card>
      <Text weight="bold">{t('scopeDemo')}</Text>
      <Text>{t('scopeDemoDescription')}</Text>
      <View style={styles.options}>
        {ShareScope.keyof().options.map((key) => (
          <Chip
            key={key}
            label={t(key)}
            selected={detail.engagement.scope[key]}
            disabled={save.isPending}
            onPress={() =>
              save.mutate({
                engagementId: detail.engagement.id,
                scope: { ...detail.engagement.scope, [key]: !detail.engagement.scope[key] },
              })
            }
          />
        ))}
      </View>
      {save.isError ? <ErrorState message={t('scopeError')} /> : null}
    </Card>
  );
}
const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
