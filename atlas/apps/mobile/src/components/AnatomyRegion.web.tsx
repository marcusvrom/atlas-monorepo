import type { AnatomyRegionProps } from './AnatomyRegion';
export function AnatomyRegion({ onPress, label, selected, ...props }: AnatomyRegionProps) {
  return (
    <path
      {...props}
      role="button"
      aria-label={label}
      aria-pressed={selected}
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onPress();
        }
      }}
    />
  );
}
