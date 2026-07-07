import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableDeleteActionPath = (): string | undefined =>
  useMetaStore((state) => state.deleteActionPath);
