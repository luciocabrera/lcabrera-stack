import type { TableDensity } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetTitleDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return (titleDensity: TableDensity | undefined) => {
    densityStore.set({ titleDensity });
  };
};
