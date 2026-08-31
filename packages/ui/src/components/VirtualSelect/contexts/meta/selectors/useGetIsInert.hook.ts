import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetIsInert = () =>
  useSelectMetaStore<boolean>((state) => state.isBusy || state.isDisabled);
