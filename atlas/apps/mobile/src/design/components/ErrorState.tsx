import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { t } from '../../i18n';
import { Card } from './Card';
import { Button } from './Button';
import { Text } from './Text';
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card>
      <View accessibilityRole="alert" style={styles.content}>
        <Text variant="title3" weight="semibold" tone="danger">
          {t('loadError')}
        </Text>
        <Text tone="secondary">{message}</Text>
        {onRetry ? <Button label={t('retry')} variant="ghost" onPress={onRetry} /> : null}
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.md } });
