import { createContext } from 'react';

import type { FiltersDataContextValue } from './FiltersDataContext.types';

export const FiltersDataContext = createContext<FiltersDataContextValue>(
  {} as FiltersDataContextValue,
);

FiltersDataContext.displayName = 'FiltersDataContext';
