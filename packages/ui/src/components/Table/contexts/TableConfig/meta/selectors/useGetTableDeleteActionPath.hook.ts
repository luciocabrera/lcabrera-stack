import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableDeleteActionPath = () =>
  useMetaStore((state) => state.deleteActionPath);
