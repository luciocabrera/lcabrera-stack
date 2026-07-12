import { createContext } from 'react';

import type { VirtualListDataContextValue } from './VirtualListDataContext.types';

export const VirtualListDataContext = createContext<
  undefined | VirtualListDataContextValue
>(undefined);

VirtualListDataContext.displayName = 'VirtualListDataContext';
