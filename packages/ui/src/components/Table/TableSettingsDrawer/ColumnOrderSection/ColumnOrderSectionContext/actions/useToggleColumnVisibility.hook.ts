import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { useTableDrawerContextValue } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';

import { useGetRenderedColumnKeys } from '../../hooks';
import { resolveColumnGroupingChoices } from '../../utils';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

type UseToggleColumnVisibilityArgs = {
  readonly columnKey: string;
  readonly isVisible: boolean;
};

/**
 * While grouping is applied a column is shown by joining the grouping, so turning one on
 * asks how rather than writing visibility (ADR-095); turning one off is unchanged.
 * The static guard reads `staticKeys`, which is built from the declared columns and so
 * still answers for a column the grouping scoped out of the grid.
 */
export const useToggleColumnVisibility = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const aggregates = useGetGroupingAggregates();
  const capabilities = useGetTableGroupingCapabilities();
  const columns = useGetColumns();
  const groupingKeys = useGetGroupingKeys();
  const notify = useNotifyAction();
  const renderedColumnKeys = useGetRenderedColumnKeys();

  return ({ columnKey, isVisible }: UseToggleColumnVisibilityArgs) => {
    const staticKeys = tableColumnsStore.get()?.staticKeys ?? new Set<string>();

    if (staticKeys.has(columnKey)) return;

    const isGrouped = groupingKeys.length > 0;

    if (isGrouped && isVisible && !renderedColumnKeys.includes(columnKey)) {
      const column = columns.find(
        (candidate) => String(candidate.key) === columnKey,
      );
      const choices = resolveColumnGroupingChoices({
        aggregates,
        capability: capabilities[columnKey],
        column,
        groupingKeys,
      });

      if (choices.length === 0) {
        notify({
          message: `${column?.label ?? columnKey} is offered neither as a group key nor as an aggregate here, so this grouping cannot show it.`,
          title: 'Not available while grouping',
          variant: 'warning',
        });
        return;
      }

      modalsStore.set({ columnGroupingPrompt: { columnKey, isOpen: true } });
      return;
    }

    const columnVisibility =
      drawerColumnsStore.get()?.columnVisibility ??
      (new Set() as ColumnVisibilityState);
    const newVisibility = new Set(columnVisibility);
    if (isVisible) {
      newVisibility.delete(columnKey);
    } else {
      newVisibility.add(columnKey);
    }
    drawerColumnsStore.set({ columnVisibility: newVisibility });
  };
};
