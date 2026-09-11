import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
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
          <HeroArtwork context={artwork} scrim={false} radius="lg" style={styles.art} />
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
  // Faixa baixa de propósito: apoia a mensagem sem empurrar a ação para fora
  // da primeira dobra num aparelho pequeno.
  art: { height: layout.coverCard },
});
