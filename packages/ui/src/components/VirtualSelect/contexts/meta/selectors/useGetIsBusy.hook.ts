import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Whether the parent is busy (shimmer overlay + disabled trigger). */
export const useGetIsBusy = () =>
  useSelectMetaStore<boolean>((state) => state.isBusy);
