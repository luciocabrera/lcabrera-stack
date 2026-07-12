import { useListConfigStore } from '../useListConfigStore.hook';

/** Whether option rows render with checkboxes. */
export const useGetHasCheckboxes = () =>
  useListConfigStore<boolean>((state) => state.hasCheckboxes);
