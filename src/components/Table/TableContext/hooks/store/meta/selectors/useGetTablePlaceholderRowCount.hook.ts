import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTablePlaceholderRowCount = () =>
  useMetaStore<number>((state) => state.placeholderRowCount);
