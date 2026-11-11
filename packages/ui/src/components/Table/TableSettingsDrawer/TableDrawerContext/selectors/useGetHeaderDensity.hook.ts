import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useGetHeaderDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return useStoreSelector({
    selector: (state) => state.headerDensity,
    store: densityStore,
  });
};
