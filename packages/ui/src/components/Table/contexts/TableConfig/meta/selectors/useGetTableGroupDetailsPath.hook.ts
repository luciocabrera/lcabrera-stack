import { useMetaStore } from '#ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableGroupDetailsPath = () =>
  useMetaStore((state) => state.groupDetailsPath);
