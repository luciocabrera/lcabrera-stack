import { createContext } from 'react';

import type { VirtualListConfigContextValue } from './VirtualListConfigContext.types';

export const VirtualListConfigContext = createContext<
  undefined | VirtualListConfigContextValue
>(undefined);

VirtualListConfigContext.displayName = 'VirtualListConfigContext';
