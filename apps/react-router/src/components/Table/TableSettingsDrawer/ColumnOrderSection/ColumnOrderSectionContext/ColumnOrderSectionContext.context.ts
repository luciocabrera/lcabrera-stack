import { createContext } from 'react';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

export const ColumnOrderSectionContext =
  createContext<ColumnOrderSectionContextValue | null>(null);

ColumnOrderSectionContext.displayName = 'ColumnOrderSectionContext';
