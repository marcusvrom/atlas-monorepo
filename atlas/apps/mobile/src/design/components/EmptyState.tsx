import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Card } from './Card';
import { Button } from './Button';
import { Text } from './Text';
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card>
      <View style={styles.content}>
        <Text variant="title3" weight="semibold">
          {title}
        </Text>
        <Text tone="secondary">{description}</Text>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
      </View>
    </Card>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.md } });
