import type { DataKey } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

/**
 * Selector for a single column's width. Returns a `number` (or `undefined`
 * when unset), so a width change to a *different* column is `Object.is`-equal
 * and does not re-render this subscriber — unlike `useGetColumnSizing`, which
 * returns the whole `columnSizing` map (a fresh reference on every write) and
 * re-renders every consumer on any column's width change.
 */
export const useGetColumnWidth = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<number | undefined, TData>(
    (state) => state.columnSizing[columnKey],
  );
