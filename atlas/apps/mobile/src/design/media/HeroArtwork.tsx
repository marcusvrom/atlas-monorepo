import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius as radiusTokens } from '@atlas/design-tokens';
import { CoverImage } from './CoverImage';
import { artworkAspect, artworkFor, type ArtworkContext } from './artwork';
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
 * **A altura vem da imagem, não do chamador.** Os assets editoriais são retrato
 * (3:4 e 2:3) e viviam numa caixa de 212 pt de altura: com a largura da tela,
 * isso recortava mais da metade da altura da foto, e a figura central perdia a
 * cabeça ou os pés conforme o arquivo. Agora o componente aplica a proporção
 * real da arte (`artworkAspect`) e o `cover` não tem o que cortar — o enquadre
 * que o fotógrafo compôs é o que aparece.
 *
 * `aspect` existe para o caso em que a proporção da imagem não pode mandar: um
 * cartão de trilho ou uma faixa estreita tem forma própria, e ali recortar é o
 * comportamento certo. É uma exceção explícita, não o padrão.
 *
 * Se a imagem falhar, o que fica não é um retângulo cinza — é a arte vetorial
 * semeada pelo próprio contexto, que já estava desenhada por baixo desde o
 * primeiro frame.
 */
export function HeroArtwork({
  context,
  alt,
  scrim = true,
  radius = 'xxl',
  aspect,
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
  /**
   * Proporção forçada (largura ÷ altura). Só para superfícies com forma própria
   * — trilhos, faixas. O padrão é a proporção da própria arte, que é o que
   * impede o recorte da figura.
   */
  aspect?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const spec = artworkFor(context);
  const asset = artworkAsset(spec.asset);
  const ratio = aspect ?? artworkAspect(context);
  const styles = useMemo(
    () => StyleSheet.create({ frame: { width: '100%', aspectRatio: ratio }, body: { flex: 1 } }),
    [ratio],
  );

  const informative = alt !== undefined && alt.length > 0;

  return (
    <View
      style={[styles.frame, style]}
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
