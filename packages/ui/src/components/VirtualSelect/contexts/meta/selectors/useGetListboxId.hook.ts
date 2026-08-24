import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetListboxId = () =>
  useSelectMetaStore<string>((state) => state.listboxId);
