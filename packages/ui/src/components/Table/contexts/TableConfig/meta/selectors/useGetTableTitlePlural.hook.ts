import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableTitlePlural = () =>
  useMetaStore<string | undefined>((state) => state.title?.plural);
