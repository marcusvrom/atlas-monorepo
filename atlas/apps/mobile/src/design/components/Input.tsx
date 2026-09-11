import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { glass, radius, spacing, typography } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Text } from './Text';
export function Input({
  label,
  error,
  hint,
  style,
  editable = true,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacing.xs },
        input: {
          minHeight: spacing.xxxl,
          borderRadius: radius.md,
          borderWidth: glass.borderWidth,
          borderColor: colors.borderStrong,
          padding: spacing.md,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          fontSize: typography.size.body,
        },
        focus: { borderColor: colors.brand },
        error: { borderColor: colors.danger },
        disabled: { color: colors.textSecondary, backgroundColor: colors.backgroundElevated },
      }),
    [colors],
  );
  return (
    <View style={styles.root}>
      <Text weight="medium">{label}</Text>
      <TextInput
        {...props}
        editable={editable}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled: !editable }}
        placeholderTextColor={colors.textSecondary}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          styles.input,
          focused && styles.focus,
          !!error && styles.error,
          !editable && styles.disabled,
          style,
        ]}
      />
      {error ? (
        <Text tone="danger" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text tone="secondary" variant="footnote">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
