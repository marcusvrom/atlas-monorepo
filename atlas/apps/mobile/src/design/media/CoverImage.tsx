import { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { motion, radius as radiusTokens } from '@atlas/design-tokens';
import { usableMediaUri } from '../../lib/media';
import { CoverArt, CoverScrim } from './CoverArt';
import type { CoverGlyph } from './cover-art';

/**
 * Superfície de capa: arte gerada como base, foto real por cima quando existir.
 *
 * A ordem importa. A arte é o piso garantido — nunca há retângulo cinza, nunca
 * há "pop" de layout quando a imagem chega. A foto entra por cima com fade; se
 * a URL falhar, ela simplesmente não aparece e a capa continua inteira, sem
 * estado de erro para a tela tratar. É o mesmo componente antes e depois do
 * backend existir: na integração, basta o `thumbnailUrl` passar a resolver.
 */
export function CoverImage({
  seed,
  uri,
  glyph,
  scrim = false,
  radius = 'lg',
  style,
  children,
}: {
  /** Identificador de domínio estável — ver `cover-art.ts`. */
  seed: string;
  uri?: string | null;
  glyph?: CoverGlyph;
  scrim?: boolean;
  radius?: keyof typeof radiusTokens;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const remote = usableMediaUri(uri);
  const [failed, setFailed] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { borderRadius: radiusTokens[radius], overflow: 'hidden' },
      }),
    [radius],
  );

  return (
    <View style={[styles.root, style]}>
      <CoverArt seed={seed} glyph={glyph} />
      {remote && !failed ? (
        <Image
          source={{ uri: remote }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={motion.duration.base}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : null}
      {scrim ? <CoverScrim /> : null}
      {children}
    </View>
  );
}
