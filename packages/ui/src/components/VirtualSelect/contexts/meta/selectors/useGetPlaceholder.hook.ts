import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Placeholder text shown while nothing is selected. */
export const useGetPlaceholder = () =>
  useSelectMetaStore<string>((state) => state.placeholder);
