import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsRounded = () =>
  useMetaStore<boolean>((state) => state.isRounded);
