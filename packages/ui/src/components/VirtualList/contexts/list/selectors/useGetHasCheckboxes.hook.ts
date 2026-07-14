import { useListStore } from '../useListStore.hook';

/** Whether option rows render with checkboxes. */
export const useGetHasCheckboxes = () =>
  useListStore<boolean>((state) => state.hasCheckboxes);
