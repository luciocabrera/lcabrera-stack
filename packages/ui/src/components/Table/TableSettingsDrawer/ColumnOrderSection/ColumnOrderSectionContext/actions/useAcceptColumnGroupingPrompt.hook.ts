import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';
import type { ColumnGroupingChoice } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useAddColumnAggregate,
  useToggleGroupKey,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/actions';
import { useTableDrawerContextValue } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useCancelColumnGroupingPrompt } from './useCancelColumnGroupingPrompt.hook';

export const useAcceptColumnGroupingPrompt = () => {
  const { columnsStore: drawerColumnsStore } = useTableDrawerContextValue();
  const { modalsStore } = useColumnOrderSectionContextValue();
  const capabilities = useGetTableGroupingCapabilities();
  const columns = useGetColumns();
  const addColumnAggregate = useAddColumnAggregate();
  const cancelColumnGroupingPrompt = useCancelColumnGroupingPrompt();
  const toggleGroupKey = useToggleGroupKey();

  return (choice: ColumnGroupingChoice) => {
    const prompt = modalsStore.get()?.columnGroupingPrompt;

    cancelColumnGroupingPrompt();

    if (prompt === undefined || !prompt.isOpen) return;

    const { columnKey } = prompt;
    const columnVisibility =
      drawerColumnsStore.get()?.columnVisibility ??
      (new Set() as ColumnVisibilityState);

    if (columnVisibility.has(columnKey)) {
      const shown = new Set(columnVisibility);
      shown.delete(columnKey);
      drawerColumnsStore.set({ columnVisibility: shown });
    }

    if (choice !== 'group-key') {
      addColumnAggregate({ columnKey, fn: choice });
      return;
    }

    toggleGroupKey({
      columnKey,
      period: resolveGroupKeyAvailability({
        capability: capabilities[columnKey],
        column: columns.find(
          (candidate) => String(candidate.key) === columnKey,
        ),
      }).requiredPeriod,
    });
  };
};
