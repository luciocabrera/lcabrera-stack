import { useMetaStore } from '@lcabrera/ui/components/Table/contexts/TableConfig/meta/useMetaStore.hook';

export const useGetTableOverscan = () =>
  useMetaStore<number>((state) => state.overscan);
