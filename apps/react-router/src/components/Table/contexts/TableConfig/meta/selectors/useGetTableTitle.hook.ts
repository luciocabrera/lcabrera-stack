import { useMetaStore } from '../useMetaStore.hook.ts';

export const useGetTableTitle = () =>
  useMetaStore<string | undefined>((state) => state.title);
