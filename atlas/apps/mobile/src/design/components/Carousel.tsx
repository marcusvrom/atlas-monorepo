import { ScrollView, StyleSheet } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';

/**
 * Trilho horizontal de cards.
 *
 * O recuo lateral vem de `contentContainerStyle`, não do pai: assim o primeiro
 * card alinha com o texto da tela e o último ainda respira na borda, enquanto a
 * rolagem continua indo de sangria a sangria — cortar um card na margem é
 * justamente o que sinaliza "tem mais para o lado".
 *
 * `decelerationRate="fast"` com `snapToInterval` prende o card na posição sem
 * o comportamento de página cheia, que travaria demais para uma lista curta.
 *
 * Deliberadamente não usa `FlashList`: o trilho mostra uma amostra de tamanho
 * fixo (3 a 6 itens) definida pela tela. Coleção sem limite continua sendo
 * lista vertical virtualizada.
 */
export function Carousel({
  children,
  itemWidth,
  label,
}: {
  children: React.ReactNode;
  /** Largura do card — usada para o snap. */
  itemWidth: number;
  label: string;
}) {
  return (
    <ScrollView
      horizontal
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      snapToInterval={itemWidth + spacing.md}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingHorizontal: layout.pageInset },
});
