import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableDefaultGroupFold = () =>
  useMetaStore((state) => state.defaultGroupFold);
