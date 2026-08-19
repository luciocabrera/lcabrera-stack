import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsGroupingLocked = () =>
  useMetaStore((state) => state.isGroupingLocked === true);
