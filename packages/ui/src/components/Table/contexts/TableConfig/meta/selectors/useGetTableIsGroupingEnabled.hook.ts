import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableIsGroupingEnabled = () =>
  useMetaStore((state) => state.isGroupingEnabled === true);
