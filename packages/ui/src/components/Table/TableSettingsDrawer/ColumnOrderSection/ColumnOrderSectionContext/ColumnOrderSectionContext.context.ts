import { createContext } from 'react';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

export const ColumnOrderSectionContext = createContext<
  ColumnOrderSectionContextValue | undefined
>(undefined);

ColumnOrderSectionContext.displayName = 'ColumnOrderSectionContext';
