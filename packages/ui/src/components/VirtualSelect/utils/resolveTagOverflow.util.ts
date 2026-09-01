import type { VirtualSelectMode } from '../VirtualSelect.types';

export type ResolveTagOverflowArgs = {
  readonly mode: VirtualSelectMode;
  readonly selectedLabels: readonly string[];
  readonly visibleTagCount: number;
};

export const resolveTagOverflow = ({
  mode,
  selectedLabels,
  visibleTagCount,
}: ResolveTagOverflowArgs) => {
  const shouldUseTagCount = mode === 'multi' && selectedLabels.length > 0;
  const visibleCount = shouldUseTagCount
    ? visibleTagCount
    : selectedLabels.length;

  return {
    overflowCount: selectedLabels.length - visibleCount,
    visibleTags: selectedLabels.slice(0, visibleCount),
  };
};
