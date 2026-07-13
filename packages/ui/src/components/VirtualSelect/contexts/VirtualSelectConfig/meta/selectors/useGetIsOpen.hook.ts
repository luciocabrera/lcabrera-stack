import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Whether the dropdown is open (chevron direction / aria-expanded). */
export const useGetIsOpen = () =>
  useSelectMetaStore<boolean>((state) => state.isOpen);
