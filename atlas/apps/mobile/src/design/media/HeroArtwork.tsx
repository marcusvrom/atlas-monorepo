import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius as radiusTokens } from '@atlas/design-tokens';
import { CoverImage } from './CoverImage';
import { artworkFor, type ArtworkContext } from './artwork';
import { artworkAsset } from './artwork-assets';

/**
 * Superfície editorial de um momento da jornada.
 *
 * A tela declara **o que aquele espaço significa** (`context`) e recebe a arte
 * certa com véu, fallback e acessibilidade já resolvidos. É a única porta de
 * entrada das imagens de `assets/marketing/` — nenhum `import` de `.webp`
 * sobrevive nas telas.
 *
 * Sobre acessibilidade, a regra é a do WCAG 1.1.1 e não "todo mundo ganha alt":
 * quando a arte é apoio de um texto que já está na tela (o caso de todos os
 * heros do Atlas), descrevê-la faz o leitor de tela anunciar duas vezes a mesma
 * coisa. Por isso o padrão é decorativo, e `alt` existe para o caso em que a
 * imagem **for** a informação — aí ela deixa de ser escondida e passa a ser
 * anunciada como imagem.
 *
 * O recorte é `cover` (herdado do `CoverImage`) com o container controlando a
 * altura: o miolo da foto sobrevive tanto no hero de 212 pt quanto na faixa de
 * 84 pt, sem esticar. E se a imagem falhar, o que fica não é um retângulo
 * cinza — é a arte vetorial semeada pelo próprio contexto, que já estava
 * desenhada por baixo desde o primeiro frame.
 */
export function HeroArtwork({
  context,
  alt,
  scrim = true,
  radius = 'xxl',
  style,
  children,
}: {
  context: ArtworkContext;
  /**
   * Descrição acessível. Informe **apenas** quando a imagem carregar informação
   * que o texto ao redor não carrega; do contrário a arte é anunciada como
   * decoração (isto é, silenciada).
   */
  alt?: string;
  /** Véu de contraste. Desligue só quando não houver texto por cima. */
  scrim?: boolean;
  radius?: keyof typeof radiusTokens;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const spec = artworkFor(context);
  const asset = artworkAsset(spec.asset);
  const styles = useMemo(() => StyleSheet.create({ body: { flex: 1 } }), []);

  const informative = alt !== undefined && alt.length > 0;

  return (
    <View
      style={style}
      accessible={informative}
      accessibilityRole={informative ? 'image' : undefined}
      accessibilityLabel={informative ? alt : undefined}
    >
      <CoverImage
        seed={spec.seed}
        glyph={spec.glyph}
        asset={asset}
        scrim={scrim}
        radius={radius}
        style={styles.body}
      >
        {children}
      </CoverImage>
    </View>
  );
}
