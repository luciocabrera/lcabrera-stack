import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** CSS max-height for the dropdown list scroll area. */
export const useGetListMaxHeight = () =>
  useSelectMetaStore<string>((state) => state.listMaxHeight);
