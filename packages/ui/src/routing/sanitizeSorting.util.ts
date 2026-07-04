import type { SortingState } from '@repo/ui/components/Table';

type SanitizedSortingEntry<TData extends Record<string, unknown>> = {
  readonly columnKey: keyof TData & string;
  readonly direction: 'asc' | 'desc';
};

/**
 * Removes sorting entries with no direction or the UI-only 'actions' column key.
 */
export const sanitizeSorting = <TData extends Record<string, unknown>>(
  sorting: SortingState<TData>,
): SanitizedSortingEntry<TData>[] =>
  sorting.filter(
    (s): s is { columnKey: keyof TData & string; direction: 'asc' | 'desc' } =>
      s.direction !== undefined && s.columnKey !== 'actions',
  );
