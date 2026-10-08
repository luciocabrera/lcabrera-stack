import type { SortingState } from '@lcabrera/ui/components/Table';

import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

export const toTrialSorting = <TData extends Record<string, unknown>>(
  sorting: SortingState<TData>,
) =>
  sanitizeSorting<TData>(sorting).map(({ columnKey, direction }) => ({
    column: columnKey,
    direction,
  }));
