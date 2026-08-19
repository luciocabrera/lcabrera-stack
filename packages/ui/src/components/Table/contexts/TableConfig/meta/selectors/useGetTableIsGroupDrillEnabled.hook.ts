import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsGroupDrillEnabled = () =>
  useMetaStore((state) => state.isGroupDrillEnabled === true);
