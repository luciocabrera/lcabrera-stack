import { useSetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetColumnFilters } from '../../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../../TableDrawerContext/selectors';

/**
 * Remove flow for one active-filter row: drops the column's filter from the
 * drawer draft and its persisted expansion entry — the counterpart to
 * AddFilterSection's add flow, shared by the row header's remove button and
 * the inputs' clear path.
 */
export const useRemoveFilterItem = () => {
  const filters = useGetColumnFilters();
  const expandedFilters = useGetTableSettingsExpandedFilters();
  const setColumnFilters = useSetColumnFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();

  return (columnKey: string) => {
    setColumnFilters(
      Object.fromEntries(
        Object.entries(filters).filter(([key]) => key !== columnKey),
      ),
    );
    setExpandedFilters(expandedFilters.filter((key) => key !== columnKey));
  };
};
