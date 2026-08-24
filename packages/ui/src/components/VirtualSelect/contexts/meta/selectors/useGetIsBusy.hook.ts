import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetIsBusy = () =>
  useSelectMetaStore<boolean>((state) => state.isBusy);
