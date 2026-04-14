import { createContext } from 'react';

import type { FiltersDataContextValue } from './FiltersDataContext.types';

/**
 * Filters data context for sharing filter lookup state across table components.
 *
 * Separated from TableDataContext so it survives Suspense key changes
 * (e.g. sorting/filter navigations) without losing already-fetched lookup data.
 */
export const FiltersDataContext = createContext<FiltersDataContextValue>(
  {} as FiltersDataContextValue,
);

FiltersDataContext.displayName = 'FiltersDataContext';
