import { useMetaStore } from '@repo/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsColumnSettingsPinned = () =>
  useMetaStore<boolean>((state) => state.isColumnSettingsPinned ?? false);
