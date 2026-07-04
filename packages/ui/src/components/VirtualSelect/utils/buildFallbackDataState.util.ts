import type { VirtualSelectOption } from '../VirtualSelect.types';

export const buildFallbackDataState = (
  optionEntries: readonly VirtualSelectOption[],
) => ({
  data: optionEntries.map((o) => o.label),
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
});
