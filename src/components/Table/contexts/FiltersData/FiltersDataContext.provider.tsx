import type { FiltersDataState } from '@/components/Table/Table.types';

import { useStore } from '@/hooks';

import type { FiltersDataContextValue } from './FiltersDataContext.types';

import { useGetColumns } from '../TableConfig/columns/selectors';
import { getInitialFiltersDataState } from '../TableData/utils';
import { FiltersDataContext } from './FiltersDataContext.context';

type FiltersDataProviderProps = {
  children: React.ReactNode;
};

/**
 * Provider for filter lookup data (distinct values).
 *
 * Must be placed ABOVE the Suspense boundary so the store survives
 * key changes triggered by sort/filter navigations.
 */
export const FiltersDataProvider = <TData extends Record<string, unknown>>({
  children,
}: FiltersDataProviderProps) => {
  const columns = useGetColumns();

  const filtersDataStore = useStore<FiltersDataState<TData>>(
    getInitialFiltersDataState<TData>({ columns }),
  );

  const value = {
    filtersDataStore,
  } as FiltersDataContextValue;

  return <FiltersDataContext value={value}>{children}</FiltersDataContext>;
};
