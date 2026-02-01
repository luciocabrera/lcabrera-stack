import type { TableDensity } from '@/components/Table/Table.types';

import { useMetaStore } from '@/components/Table/TableContext/hooks/store/meta/useMetaStore.hook';

export const useGetTableDensity = () =>
  useMetaStore<TableDensity>((state) => state.density);
