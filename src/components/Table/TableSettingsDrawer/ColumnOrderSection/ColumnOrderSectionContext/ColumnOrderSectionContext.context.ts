import { createContext } from 'react';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

import { getInitialModalsState } from './utils';

export const ColumnOrderSectionContext =
  createContext<ColumnOrderSectionContextValue>({
    modalsStore: getInitialModalsState(),
  } as unknown as ColumnOrderSectionContextValue);

ColumnOrderSectionContext.displayName = 'ColumnOrderSectionContext';
