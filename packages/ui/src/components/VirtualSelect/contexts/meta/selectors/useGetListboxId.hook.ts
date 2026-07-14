import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** id wiring the trigger/listbox ARIA relationship. */
export const useGetListboxId = () =>
  useSelectMetaStore<string>((state) => state.listboxId);
