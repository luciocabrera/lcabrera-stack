import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { COLUMN_GROUPING_REFUSAL_MESSAGES } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.constants';
import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';
import { useTableDrawerContextValue } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';

import {
  isColumnNamedByGrouping,
  resolveColumnGroupingChoices,
} from '../../utils';
import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';

type UseToggleColumnVisibilityArgs = {
  readonly columnKey: string;
  readonly isVisible: boolean;
};

export const useToggleColumnVisibility = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const aggregates = useGetGroupingAggregates();
  const capabilities = useGetTableGroupingCapabilities();
  const columns = useGetColumns();
  const groupingKeys = useGetGroupingKeys();
  const notify = useNotifyAction();

  return ({ columnKey, isVisible }: UseToggleColumnVisibilityArgs) => {
    const staticKeys = tableColumnsStore.get()?.staticKeys ?? new Set<string>();

    if (staticKeys.has(columnKey)) return;

    const isGrouped = groupingKeys.length > 0;
    const isNamed = isColumnNamedByGrouping({
      aggregates,
      columnKey,
      groupingKeys,
    });

    if (isGrouped && isVisible && !isNamed) {
      const column = columns.find(
        (candidate) => String(candidate.key) === columnKey,
      );
      const { options, refusal } = resolveColumnGroupingChoices({
        aggregates,
        capability: capabilities[columnKey],
        column,
        groupingKeys,
      });

      if (options.length === 0) {
        notify({
          message: COLUMN_GROUPING_REFUSAL_MESSAGES[refusal ?? 'not-offered'],
          title: `${column?.label ?? columnKey} is not in this grouping`,
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
