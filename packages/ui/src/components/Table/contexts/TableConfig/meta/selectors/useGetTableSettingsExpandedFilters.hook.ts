import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableSettingsExpandedFilters = () =>
  useMetaStore<readonly string[]>(
    (state) => state.tableSettingsExpandedFilters,
  );
