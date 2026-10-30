import type { TableDensity } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useSetTableDensity = () => {
  const { metaStore } = useTableConfigContextValue();

  return (density: TableDensity) => {
    metaStore.set({ density });
  };
};
