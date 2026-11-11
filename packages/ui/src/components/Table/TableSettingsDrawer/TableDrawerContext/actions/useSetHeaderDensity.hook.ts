import type { TableDensity } from '#ui/components/Table/Table.types';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useSetHeaderDensity = () => {
  const { densityStore } = useTableDrawerContextValue();

  return (headerDensity: TableDensity | undefined) => {
    densityStore.set({ headerDensity });
  };
};
