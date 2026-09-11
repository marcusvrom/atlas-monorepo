import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { layout, palette, opacity } from '@atlas/design-tokens';
/** ATL-UI-001: ilustração vetorial decorativa; não representa um exercício. */
export function WorkoutArtwork() {
  return (
    <Svg width={layout.heroArt} height={layout.heroArt} viewBox="0 0 120 120" aria-hidden>
      <Circle cx="60" cy="60" r="56" fill={palette.brand400} opacity={opacity.subtle} />
      <Circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke={palette.brand400}
        opacity={opacity.decorative}
      />
      <G transform="rotate(-32 60 60)">
        <Rect x="30" y="55" width="60" height="10" rx="5" fill={palette.ink800} />
        <Rect x="22" y="34" width="17" height="52" rx="7" fill={palette.brand400} />
        <Rect x="13" y="44" width="9" height="32" rx="4" fill={palette.brand600} />
        <Rect x="81" y="34" width="17" height="52" rx="7" fill={palette.brand400} />
        <Rect x="98" y="44" width="9" height="32" rx="4" fill={palette.brand600} />
        <Path
          d="M28 43v26M87 43v26"
          stroke={palette.brand200}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}
