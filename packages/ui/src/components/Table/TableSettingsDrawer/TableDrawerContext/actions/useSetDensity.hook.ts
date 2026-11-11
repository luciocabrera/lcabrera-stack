import type { TableDensity } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return (density: TableDensity | undefined) => {
    densityStore.set({ density });
  };
};
