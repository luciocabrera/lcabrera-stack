import type { VirtualListDataState } from '@repo/ui/components/VirtualList';

import type {
  VirtualSelectMode,
  VirtualSelectOption,
} from '../VirtualSelect.types';

import { buildFallbackDataState } from './buildFallbackDataState.util';

export type ResolveVirtualSelectDisplayArgs = {
  readonly dataState?: VirtualListDataState;
  readonly mode: VirtualSelectMode;
  readonly optionEntries: readonly VirtualSelectOption[];
  readonly selected: readonly string[];
  readonly selectedLabels: readonly string[];
  readonly visibleTagCount: number;
};

export const resolveVirtualSelectDisplay = ({
  dataState,
  mode,
  optionEntries,
  selected,
  selectedLabels,
  visibleTagCount,
}: ResolveVirtualSelectDisplayArgs) => {
  const isMulti = mode === 'multi';
  const hasSelection = selected.length > 0;
  const shouldUseTagCount = isMulti && hasSelection;
  const computedVisibleCount = shouldUseTagCount
    ? visibleTagCount
    : selected.length;
  const overflowCount = selected.length - computedVisibleCount;
  const visibleTags = selectedLabels.slice(0, computedVisibleCount);

  return {
    effectiveDataState: dataState ?? buildFallbackDataState(optionEntries),
    isMulti,
    overflowCount,
    visibleTags,
  };
};
