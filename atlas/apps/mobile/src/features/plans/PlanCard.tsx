import type { WorkoutPlanSummary } from '@atlas/contracts';
import { StyleSheet, View } from 'react-native';
import { layout, spacing } from '@atlas/design-tokens';
import { Badge, CoverCard, MetaChip, MetaChipRow } from '../../design/components';
import { t } from '../../i18n';

/**
 * Ficha na lista de fichas.
 *
 * Virou card de capa de largura cheia — a ficha é a unidade que o usuário
 * escolhe, então merece o mesmo peso visual que as referências dão aos cards
 * de programa. A capa é semeada pelo id da ficha, o que dá a cada ficha uma
 * identidade de cor que se repete no detalhe e em "Hoje".
 *
 * O selo de ficha ativa fica no canto superior, fora do rodapé de texto: é
 * estado, não descrição, e precisa ser visto antes do nome ser lido.
 */
export function PlanCard({ plan, onPress }: { plan: WorkoutPlanSummary; onPress: () => void }) {
  return (
    <View style={styles.root}>
      <CoverCard
        seed={plan.id}
        glyph="barbell"
        height={layout.coverCard}
        eyebrow={t(plan.goal)}
        title={plan.name}
        accessibilityLabel={plan.name + ', ' + t('planOpenHint')}
        meta={
          <MetaChipRow>
            <MetaChip
              onCover
              icon="calendar"
              label={
                plan.dayCount + ' ' + t(plan.dayCount === 1 ? 'planDaySingular' : 'planDaysShort')
              }
            />
            <MetaChip onCover icon="layers" label={t('version') + ' ' + plan.version} />
          </MetaChipRow>
        }
        onPress={onPress}
      />
      {plan.isActive ? (
        <View style={styles.badge}>
          <Badge label={t('planActive')} tone="success" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: spacing.md },
  badge: { pointerEvents: 'none', position: 'absolute', top: spacing.md, right: spacing.md },
});
