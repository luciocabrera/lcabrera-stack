import type { VirtualSelectMode } from '../VirtualSelect.types';

export type ResolveTagOverflowArgs = {
  readonly mode: VirtualSelectMode;
  readonly selectedLabels: readonly string[];
  readonly visibleTagCount: number;
};

/**
 * Splits the selected labels into the tags that fit in the trigger and the overflow count
 * hidden behind the "+N more" badge.
 */
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
