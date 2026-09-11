import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { Text } from './Text';
import { Button } from './Button';
export function ListRow({
  title,
  description,
  actionLabel,
  onPress,
  disabled = false,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text weight="semibold">{title}</Text>
        {description ? <Text tone="secondary">{description}</Text> : null}
      </View>
      {onPress ? (
        <Button
          label={actionLabel ?? title}
          variant="ghost"
          onPress={onPress}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    minHeight: spacing.xxxl,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  copy: { flex: 1, gap: spacing.xs },
});
