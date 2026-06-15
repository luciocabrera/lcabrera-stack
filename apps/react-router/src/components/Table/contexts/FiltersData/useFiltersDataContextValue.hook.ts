import { use } from 'react';

import type { FiltersDataContextValue } from './FiltersDataContext.types';

import { FiltersDataContext } from './FiltersDataContext.context';

export const useFiltersDataContextValue = <
  TData = Record<string, unknown>,
>(): FiltersDataContextValue<TData> => {
  const context = use(FiltersDataContext);

  return context as FiltersDataContextValue<TData>;
};
