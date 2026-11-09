import { useSelectMetaStore } from '../useSelectMetaStore.hook';

export const useGetLabelId = () =>
  useSelectMetaStore<string | undefined>((state) => state.labelId);
