import { useId, useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  G,
  LinearGradient as SvgGradient,
  Path,
  Rect,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { cover, palette } from '@atlas/design-tokens';
import { composeCover, coverGlyphCanvas, coverGlyphPaths, type CoverGlyph } from './cover-art';

/**
 * ATL-UI-013 — arte de capa gerada.
 *
 * Substitui a fotografia das telas de referência sem depender de banco de
 * imagem: gradiente de malha + banda diagonal + glifo de equipamento, tudo
 * derivado da semente (ver `cover-art.ts`). Vetor em vez de bitmap não é só
 * economia de bundle — a capa fica nítida do thumbnail de 64 px ao hero de
 * tela cheia, e a lista desenha sem carregar um byte de rede.
 *
 * O véu de contraste **não** é desenhado aqui: a arte é recortada
 * (`slice`) para preencher containers de qualquer proporção, então um degradê
 * dentro do SVG seria cortado junto e deixaria de encostar na base do card.
 * Quem sobrepõe texto usa `<CoverScrim>`, que acompanha o container.
 */
export function CoverArt({
  seed,
  glyph,
  style,
}: {
  seed: string;
  glyph?: CoverGlyph;
  /** Apenas posicionamento; a arte sempre preenche o pai. */
  style?: StyleProp<ViewStyle>;
}) {
  const composition = useMemo(() => composeCover(seed, glyph), [seed, glyph]);
  // Ids de gradiente são globais no DOM da prévia web: sem sufixo único, duas
  // capas na mesma tela compartilhariam o primeiro gradiente declarado.
  const uid = useId().replace(/:/g, '');
  const size = cover.canvas;
  const [base, mid, light] = composition.colors;
  const ids = { base: 'cv-b-' + uid, glowA: 'cv-ga-' + uid, glowB: 'cv-gb-' + uid };
  // Canto superior esquerdo do glifo, de modo que seu centro caia na âncora.
  const glyphSize = coverGlyphCanvas * cover.glyphScale;
  const glyphX = cover.glyphAnchor.x * size - glyphSize / 2;
  const glyphY = cover.glyphAnchor.y * size - glyphSize / 2;

  return (
    <Svg
      style={[StyleSheet.absoluteFill, styles.inert, style]}
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <Defs>
        <SvgGradient id={ids.base} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={base} />
          <Stop offset="1" stopColor={mid} />
        </SvgGradient>
        <RadialGradient id={ids.glowA} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={light} stopOpacity={cover.glowOpacity} />
          <Stop offset="1" stopColor={light} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id={ids.glowB} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={mid} stopOpacity={cover.glowOpacity} />
          <Stop offset="1" stopColor={mid} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect width={size} height={size} fill={`url(#${ids.base})`} />

      {composition.glows.map((glow, index) => (
        <Rect
          key={index}
          x={(glow.cx - glow.r) * size}
          y={(glow.cy - glow.r) * size}
          width={glow.r * 2 * size}
          height={glow.r * 2 * size}
          fill={`url(#${index === 0 ? ids.glowA : ids.glowB})`}
        />
      ))}

      {/* Banda diagonal: uma aresta de luz atravessando a composição, no lugar
          do contraluz das fotos de referência. */}
      <Rect
        x={-size}
        y={composition.bandOffset * size}
        width={size * 3}
        height={cover.bandWidth * size}
        fill={light}
        opacity={cover.bandOpacity}
        transform={`rotate(${composition.bandAngle} ${size / 2} ${size / 2})`}
      />

      <G
        opacity={cover.glyphOpacity}
        transform={`translate(${glyphX} ${glyphY}) scale(${cover.glyphScale}) rotate(${composition.glyphAngle} ${coverGlyphCanvas / 2} ${coverGlyphCanvas / 2})`}
      >
        {coverGlyphPaths[composition.glyph].map((d) => (
          <Path
            key={d}
            d={d}
            stroke={palette.white}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </G>
    </Svg>
  );
}

/**
 * Véu de contraste sobre a capa. Existe como componente próprio (e não como
 * prop da arte) porque precisa acompanhar a altura real do container: é ele
 * que garante AA para o texto no rodapé do card, qualquer que seja o recorte
 * da arte por baixo.
 */
export function CoverScrim({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient
      colors={cover.scrim}
      locations={cover.scrimStops}
      style={[StyleSheet.absoluteFill, styles.inert, style]}
    />
  );
}

/** O `pointerEvents` como prop está depreciado no RN 0.86; vive no estilo. */
const styles = StyleSheet.create({ inert: { pointerEvents: 'none' } });
