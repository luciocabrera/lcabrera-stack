import type { ColumnGroupingChoice } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useAddColumnAggregate,
  useToggleGroupKey,
} from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/actions';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';

import { useColumnOrderSectionContextValue } from '../useColumnOrderSectionContextValue.hook';
import { useCancelColumnGroupingPrompt } from './useCancelColumnGroupingPrompt.hook';

export const useAcceptColumnGroupingPrompt = () => {
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

    if (choice !== 'group-key') {
      addColumnAggregate({ columnKey, fn: choice });
      return;
    }

    toggleGroupKey({
      columnKey,
      period: resolveGroupKeyAvailability({
        capability: capabilities[columnKey],
        column: columns.find((column) => String(column.key) === columnKey),
      }).requiredPeriod,
    });
  };
};
