import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetIsListVisible = () =>
  useSelectMetaStore<boolean>((state) => state.isListVisible);
