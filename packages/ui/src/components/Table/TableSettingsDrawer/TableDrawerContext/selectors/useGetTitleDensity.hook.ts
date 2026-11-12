import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useGetTitleDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return useStoreSelector({
    selector: (state) => state.titleDensity,
    store: densityStore,
  });
};
