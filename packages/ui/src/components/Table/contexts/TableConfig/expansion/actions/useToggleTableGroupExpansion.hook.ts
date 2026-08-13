import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import {
  resolveTableGroupTree,
  toggleCollapsedGroupPath,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { moveTableFocusToRow } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { resolveGroupCollapseFocusTarget } from './utils';

/**
 * Opens or closes one group, keyed by its path.
 *
 * The write is local: expansion changes nothing server-side, so this touches no
 * URL param and triggers no revalidation — the grouped result is already
 * materialised in memory and collapsing filters it (ADR-061). That is the whole
 * reason it does not go through `useSetTableGrouping`, which exists to navigate.
 *
 * Collapsing can take the focused row out of the grid, so focus is repositioned
 * **before** the store write. Order matters: the focused cell's unmount
 * releases the grid's tab stop only while the store still names that cell, so a
 * focus target moved first is left alone by the row that is about to vanish,
 * and moved after would be revoked by it.
 */
export const useToggleTableGroupExpansion = <
  TData extends Record<string, unknown>,
>() => {
  const { columnsStore, expansionStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();

  return (path: readonly TableGroupKeyValue[]) => {
    const { collapsedGroupPaths } = expansionStore.get();
    const groupPathKey = resolveGroupPathKey(path);
    const nextCollapsed = toggleCollapsedGroupPath({
      collapsedGroupPaths,
      pathKey: groupPathKey,
    });

    if (nextCollapsed.has(groupPathKey)) {
      const focusState = focusStore.get();
      const { rows } = resolveTableGroupTree({
        collapsedGroupPaths: nextCollapsed,
        data: dataStore.get().data,
      });
      const target = resolveGroupCollapseFocusTarget({
        columns: columnsStore.get().columns,
        focusedRowKey: focusState.rowKey,
        groupPathKey,
        rows,
      });

      if (target !== undefined) {
        moveTableFocusToRow({
          container: containerRef.current,
          focusState,
          focusStore,
          rowHeight: metaStore.get().rowHeight,
          ...target,
        });
      }
    }

    expansionStore.set({ collapsedGroupPaths: nextCollapsed });
  };
};
