import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableDrawersSyncNonce = () =>
  useMetaStore<number>((state) => state.drawersSyncNonce ?? 0);
