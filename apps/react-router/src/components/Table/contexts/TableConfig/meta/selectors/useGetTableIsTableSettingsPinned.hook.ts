import { useMetaStore } from '@/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsTableSettingsPinned = () =>
  useMetaStore<boolean>((state) => state.isTableSettingsPinned);
