import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import {
  isDrillableGroupPath,
  resolveGroupToggleAction,
  resolveTableGroupTree,
  toggleCollapsedGroupPath,
} from '#ui/components/Table/contexts/TableConfig/expansion/utils';
import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useTableDataContextValue } from '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook';
import { moveTableFocusToRow } from '#ui/components/Table/contexts/TableFocus/focus/actions/utils';
import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useTableContainerRef } from '#ui/components/Table/contexts/TableWrapper';

import { useDrillTableGroup } from './useDrillTableGroup.hook';
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
  const { columnsStore, expansionStore, groupingStore, metaStore } =
    useTableConfigContextValue<TData>();
  const { dataStore } = useTableDataContextValue<TData>();
  const { focusStore } = useTableFocusContextValue();
  const containerRef = useTableContainerRef();
  const drillTableGroup = useDrillTableGroup<TData>();

  return (path: readonly TableGroupKeyValue[]) => {
    const { collapsedGroupPaths, drilledGroups } = expansionStore.get();
    const groupPathKey = resolveGroupPathKey(path);
    const action = resolveGroupToggleAction({
      drill: drilledGroups.get(groupPathKey),
      isCollapsed: collapsedGroupPaths.has(groupPathKey),
      isDrillable: isDrillableGroupPath({
        canDrill: metaStore.get().isGroupDrillEnabled ?? false,
        groupingKeys: groupingStore.get().keys,
        path,
      }),
    });

    // A drill leaves the collapsed set alone in the ordinary case — the group
    // is already expanded, since expansion is held by its complement — and
    // clears the flag in the retry case, which reaches this from a group the
    // user folded away (ADR-067, ADR-079).
    if (action === 'drill') {
      if (collapsedGroupPaths.has(groupPathKey)) {
        const reopened = new Set(collapsedGroupPaths);

        reopened.delete(groupPathKey);
        expansionStore.set({ collapsedGroupPaths: reopened });
      }

      void drillTableGroup(path);

      return;
    }

    const nextCollapsed = toggleCollapsedGroupPath({
      collapsedGroupPaths,
      pathKey: groupPathKey,
    });

    if (nextCollapsed.has(groupPathKey)) {
      const focusState = focusStore.get();
      // The same inputs `useTableGroupTree` derives the painted rows from. A
      // drilled page and its chrome are rows in that array, so a tree resolved
      // without them would hand back an index into a grid that is not the one
      // on screen (ADR-079).
      const { rows } = resolveTableGroupTree({
        canDrill: metaStore.get().isGroupDrillEnabled,
        collapsedGroupPaths: nextCollapsed,
        data: dataStore.get().data,
        drilledGroups,
        groupingKeys: groupingStore.get().keys,
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
