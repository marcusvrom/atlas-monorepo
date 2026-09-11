import { StyleSheet, View } from 'react-native';
import { spacing } from '@atlas/design-tokens';
import { HeroArtwork } from '../media/HeroArtwork';
import type { ArtworkContext } from '../media/artwork';
import { Card } from './Card';
import { Button } from './Button';
import { Text } from './Text';

/**
 * Estado vazio.
 *
 * A arte é **opcional e contextual**: entra onde o vazio é o começo de uma
 * jornada (a primeira ficha, o primeiro registro de progresso) e fica de fora
 * onde o vazio é passageiro (um filtro sem resultado). Ilustrar todo estado
 * vazio transformaria cada lista sem item num cartaz, e o usuário perderia a
 * diferença entre "não há nada ainda" e "sua busca não achou nada".
 *
 * Quando entra, a arte é decorativa: título e descrição já carregam a
 * informação, e anunciá-la de novo só faria o leitor de tela repetir.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  artwork,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  artwork?: ArtworkContext;
}) {
  return (
    <Card>
      <View style={styles.content}>
        {artwork ? (
          // Faixa larga, e não a proporção da arte: aqui a imagem apoia uma
          // mensagem curta, e um retrato de 3:4 empurraria a ação para fora da
          // primeira dobra num aparelho pequeno. É a exceção que `aspect` existe
          // para cobrir.
          <HeroArtwork
            context={artwork}
            scrim={false}
            radius="lg"
            aspect={16 / 9}
            style={styles.art}
          />
        ) : null}
        <Text variant="title3" weight="semibold">
          {title}
        </Text>
        <Text tone="secondary">{description}</Text>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  art: {},
});
