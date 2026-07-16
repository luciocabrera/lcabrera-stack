import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { persistColumnSizing } from './utils';

/**
 * Persists the column widths currently in the store, without changing any.
 *
 * For a caller that has already written a width and only needs it saved — the
 * end of a drag, whose frames went through {@link useSetColumnSizingWithoutSync}.
 * A caller that is both setting and saving a width wants
 * {@link useSetColumnSizing} instead.
 */
export const useSyncColumnsSizing = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();

  return () => {
    persistColumnSizing<TData>({ columnsStore, metaStore });
  };
};
