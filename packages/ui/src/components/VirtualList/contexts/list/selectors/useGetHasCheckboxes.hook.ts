import { useListStore } from '../useListStore.hook';

export const useGetHasCheckboxes = () =>
  useListStore<boolean>((state) => state.hasCheckboxes);
