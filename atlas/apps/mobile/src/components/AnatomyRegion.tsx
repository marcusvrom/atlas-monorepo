import { t } from '../i18n';
import { Path } from 'react-native-svg';
export interface AnatomyRegionProps {
  id: string;
  d: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  label: string;
  selected: boolean;
  onPress: () => void;
}
export function AnatomyRegion({ label, selected, ...props }: AnatomyRegionProps) {
  return (
    <Path {...props} accessibilityLabel={selected ? t('muscleSelected') + ': ' + label : label} />
  );
}
