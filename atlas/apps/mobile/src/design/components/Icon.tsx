import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { layout } from '@atlas/design-tokens';
import { useTheme } from '../theme-provider';

/**
 * Um único traço por ícone, mesmo grid de 24 e mesma espessura: é o que faz o
 * conjunto ler como família em vez de ícones avulsos. Nomes são semânticos
 * (`duration`, `energy`), não descritivos da forma — trocar o desenho de
 * "energia" depois não deve obrigar a renomear em 12 telas.
 */
const paths = {
  arrow: ['M5 12h14m-6-6 6 6-6 6'],
  back: ['M19 12H5m6-6-6 6 6 6'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  alert: ['M12 8v5', 'M12 16.5h.01', 'M12 3 2.5 20h19L12 3Z'],
  filter: ['M4 7h16M4 17h16M8 4v6m8 4v6'],
  search: ['M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0'],
  dumbbell: ['M8 12h8M3 9v6m3-9v12m12-12v12m3-9v6M3 12h3m12 0h3'],
  clock: ['M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0'],
  chart: ['M4 20V10m8 10V4m8 16v-7'],
  check: ['m5 12 4 4L19 6'],
  person: ['M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],

  // ATL-UI-013 — vocabulário das telas de referência (chips de metadado,
  // botão de reprodução sobre a capa, tiles de métrica).
  play: ['M8 5.2v13.6L19.2 12 8 5.2Z'],
  flame: [
    'M12 3c3.5 4.5 6 6.6 6 11a6 6 0 0 1-12 0c0-2.5 1.5-4.1 3-5.6 0 2 1 3.1 2 3.6 1-2.6 1-6 1-9Z',
  ],
  trophy: [
    'M7 4h10v5a5 5 0 0 1-10 0V4Z',
    'M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5',
    'M9.5 20h5M12 14v6',
  ],
  target: [
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    'M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0',
    'M12 11.9h.01',
  ],
  calendar: [
    'M4 9h16M8.5 3v4m7-4v4',
    'M5 5.5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z',
  ],
  heart: [
    'M12 20.2S4.8 15.5 4.8 10.4A4.6 4.6 0 0 1 12 7.6a4.6 4.6 0 0 1 7.2 2.8c0 5.1-7.2 9.8-7.2 9.8Z',
  ],
  scale: [
    'M4 6.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z',
    'M8 6.5v3m8-3v3M12 15.5l2.2-4',
  ],
  bolt: ['M13.2 3 4.5 14h6.6l-1.3 7 8.7-11h-6.6l1.3-7Z'],
  layers: ['m12 3 9 4.8-9 4.8-9-4.8L12 3Z', 'm3 12.4 9 4.8 9-4.8M3 16.8l9 4.8 9-4.8'],
  sparkles: [
    'm11 3 1.7 4.8L17.5 9.5l-4.8 1.7L11 16l-1.7-4.8L4.5 9.5l4.8-1.7L11 3Z',
    'm18 14.5.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z',
  ],
  camera: [
    'M4 8h3l1.8-2h6.4L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z',
    'M15.5 13.4a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0',
  ],
  ruler: ['M3 14 14 3l7 7L10 21l-7-7Z', 'M7.5 9.5 9 11m1.5-4.5L12 8m1.5-4.5L15 5'],
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  color,
  size = layout.iconSize,
  /** Ícones de ação sobre capa (play) pedem massa, não contorno. */
  filled = false,
}: {
  name: IconName;
  color?: ColorValue;
  size?: number;
  filled?: boolean;
}) {
  const { colors } = useTheme();
  const tint = color ?? colors.textPrimary;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      {paths[name].map((d) => (
        <Path
          key={d}
          d={d}
          stroke={tint}
          strokeWidth={layout.iconStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={filled ? tint : 'none'}
        />
      ))}
    </Svg>
  );
}
