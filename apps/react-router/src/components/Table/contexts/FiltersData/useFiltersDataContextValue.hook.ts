import { use } from 'react';

import { FiltersDataContext } from './FiltersDataContext.context.ts';

export const useFiltersDataContextValue = () => {
  const context = use(FiltersDataContext);

  return context;
};
