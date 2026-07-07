import type { TableCrudConfig } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '../../useTableConfigContextValue.hook';

export const useGetTableCrud = <TData extends Record<string, unknown>>() => {
  const { crud } = useTableConfigContextValue<TData>();

  return crud as TableCrudConfig<TData> | undefined;
};
