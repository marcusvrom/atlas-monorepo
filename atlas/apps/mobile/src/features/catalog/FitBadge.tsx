import type { ExerciseFit } from '@atlas/domain';
import { Badge } from '../../design/components';
import { t } from '../../i18n';
import { regionLabel } from '../../i18n/enum-labels';

/**
 * Selo de adequação de um exercício ao perfil.
 *
 * Existe para que a personalização seja **visível**. Um app que só reordena em
 * silêncio é indistinguível de um app com catálogo incompleto; o selo é o que
 * transforma "sumiu" em "saiu da frente porque você pediu para poupar o
 * joelho", e é o que dá ao usuário a informação para discordar.
 *
 * Não marca o que é simplesmente adequado: um selo em cada linha vira ruído e
 * deixa de chamar atenção justamente onde ela importa.
 */
export function FitBadge({ fit }: { fit: ExerciseFit }) {
  const region = fit.reasons.find((reason) => reason.code === 'protectedRegion')?.region;
  if (region) {
    return (
      <Badge label={t('fitProtects').replace('{region}', t(regionLabel[region]))} tone="warning" />
    );
  }

  const missing = fit.reasons.find((reason) => reason.code === 'equipmentUnavailable');
  if (missing) return <Badge label={t('fitNoEquipment')} tone="warning" />;

  if (fit.reasons.some((reason) => reason.code === 'aboveLevel')) {
    return <Badge label={t('fitAboveLevel')} tone="brand" />;
  }

  if (fit.verdict === 'recommended' && fit.reasons.some((r) => r.code === 'jointFriendly')) {
    return <Badge label={t('fitJointFriendly')} tone="success" />;
  }

  return null;
}
