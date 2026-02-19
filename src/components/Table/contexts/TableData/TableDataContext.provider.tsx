import type {
  FiltersDataState,
  TableDataState,
} from '@/components/Table/Table.types';

import { useStore } from '@/hooks';

import type {
  TableDataContextValue,
  TableDataProviderProps,
} from './TableDataContext.types';

import { useGetColumns } from '../TableConfig/columns/selectors';
import { TableDataContext } from './TableDataContext.context';
import { getInitialDataState, getInitialFiltersDataState } from './utils';

export const TableDataProvider = <TData extends Record<string, unknown>>({
  children,
  dataState,
}: TableDataProviderProps<TData>) => {
  const columns = useGetColumns();
  const dataStore = useStore<TableDataState<TData>>(
    getInitialDataState<TData>({ ...dataState }),
  );

  const filtersDataStore = useStore<FiltersDataState<TData>>(
    getInitialFiltersDataState<TData>({ columns }),
  );

  const value = {
    dataStore,
    filtersDataStore,
  } as TableDataContextValue;

  return <TableDataContext value={value}>{children}</TableDataContext>;
};
