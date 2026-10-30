import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useGetDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return useStoreSelector({
    selector: (state) => state.density,
    store: densityStore,
  });
};
