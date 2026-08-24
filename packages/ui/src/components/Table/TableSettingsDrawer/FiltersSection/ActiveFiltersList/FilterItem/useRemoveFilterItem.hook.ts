import { useSetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import { useSetColumnFilters } from '../../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../../TableDrawerContext/selectors';

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
