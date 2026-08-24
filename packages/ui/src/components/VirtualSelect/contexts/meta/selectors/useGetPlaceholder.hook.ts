import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetPlaceholder = () =>
  useSelectMetaStore<string>((state) => state.placeholder);
