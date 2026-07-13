import { useSelectMetaStore } from '../useSelectMetaStore.hook';

/** Consumer StyleX override for the dropdown container. */
export const useGetCustomStylex = () =>
  useSelectMetaStore((state) => state.customStylex);
