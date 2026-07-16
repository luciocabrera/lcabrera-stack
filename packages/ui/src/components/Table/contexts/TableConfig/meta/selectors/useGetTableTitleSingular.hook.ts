import { useMetaStore } from '../useMetaStore.hook';

export const useGetTableTitleSingular = () =>
  useMetaStore<string | undefined>((state) => state.title?.singular);
