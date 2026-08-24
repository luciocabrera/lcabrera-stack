import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetCustomStylex = () =>
  useSelectMetaStore((state) => state.customStylex);
