import { createContext } from 'react';

import type { VirtualListContextValue } from './VirtualListContext.types';

export const VirtualListContext = createContext<
  undefined | VirtualListContextValue
>(undefined);

VirtualListContext.displayName = 'VirtualListContext';
