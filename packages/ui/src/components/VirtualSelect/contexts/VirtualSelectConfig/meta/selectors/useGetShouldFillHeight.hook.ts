import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Whether the select expands to fill available vertical space. */
export const useGetShouldFillHeight = () =>
  useSelectMetaStore<boolean>((state) => state.shouldFillHeight);
