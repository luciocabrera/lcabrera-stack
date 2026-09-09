import type { FiltersDataState } from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';
import { ProvideStoreContext } from '#ui/hooks/utils/provideStoreContext.util';

import type {
  FiltersDataContextValue,
  FiltersDataProviderProps,
} from './FiltersDataContext.types';

import { getInitialFiltersDataState } from './filters/utils';
import { FiltersDataContext } from './FiltersDataContext.context';

export const FiltersDataProvider = <TData extends Record<string, unknown>>({
  children,
  columns,
}: FiltersDataProviderProps<TData>) => {
  const filtersDataStore = useStore<FiltersDataState<TData>>(
    getInitialFiltersDataState<TData>({ columns }),
  );

  const value: FiltersDataContextValue<TData> = {
    filtersDataStore,
  };

  return (
    <ProvideStoreContext context={FiltersDataContext} value={value}>
      {children}
    </ProvideStoreContext>
  );
};
