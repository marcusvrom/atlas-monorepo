import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { spacing } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
import { Text } from './Text';
import { sparklinePath } from './sparkline-path';
export function Sparkline({
  values,
  label,
  emptyLabel,
  width = spacing.huge * 3,
  height = spacing.huge,
}: {
  values: readonly number[];
  label: string;
  emptyLabel: string;
  width?: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const d = useMemo(
    () => sparklinePath(values, width, height, spacing.xs),
    [values, width, height],
  );
  if (!d) return <Text tone="secondary">{emptyLabel}</Text>;
  return (
    <Svg
      accessible
      accessibilityLabel={label}
      width={width}
      height={height}
      viewBox={'0 0 ' + width + ' ' + height}
    >
      <Path d={d} stroke={colors.brand} strokeWidth={spacing.xxs} fill="none" />
    </Svg>
  );
}
