import { use } from 'react';

import { FiltersDataContext } from './FiltersDataContext.context';

export const useFiltersDataContextValue = () => {
  const context = use(FiltersDataContext);

  return context;
};
