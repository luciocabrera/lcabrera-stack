import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetIsOpen = () =>
  useSelectMetaStore<boolean>((state) => state.isOpen);
