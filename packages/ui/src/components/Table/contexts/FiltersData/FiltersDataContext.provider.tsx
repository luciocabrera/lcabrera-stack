import type { FiltersDataState } from '@repo/ui/components/Table/Table.types';

import { useStore } from '@repo/ui/hooks';

import type {
  FiltersDataContextValue,
  FiltersDataProviderProps,
} from './FiltersDataContext.types';

import { getInitialFiltersDataState } from './filters/utils';
import { FiltersDataContext } from './FiltersDataContext.context';

/**
 * Provider for filter lookup data (distinct values).
 *
 * Must be placed ABOVE the Suspense boundary so the store survives
 * key changes triggered by sort/filter navigations.
 */
export const FiltersDataProvider = <TData extends Record<string, unknown>>({
  children,
  columns,
}: FiltersDataProviderProps<TData>) => {
  const filtersDataStore = useStore<FiltersDataState<TData>>(
    getInitialFiltersDataState<TData>({ columns }),
  );

  const value = {
    filtersDataStore,
  } as FiltersDataContextValue<TData>;

  return (
    <FiltersDataContext value={value as FiltersDataContextValue}>
      {children}
    </FiltersDataContext>
  );
};
