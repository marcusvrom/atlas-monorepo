import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { layout } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';
const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  filter: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  dumbbell: 'M8 12h8M3 9v6m3-9v12m12-12v12m3-9v6M3 12h3m12 0h3',
  clock: 'M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  chart: 'M4 20V10m8 10V4m8 16v-7',
  check: 'm5 12 4 4L19 6',
  person: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  color,
  size = layout.iconSize,
}: {
  name: IconName;
  color?: ColorValue;
  size?: number;
}) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={paths[name]}
        stroke={color ?? colors.textPrimary}
        strokeWidth={layout.iconStroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
