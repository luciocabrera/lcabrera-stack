import { createContext } from 'react';

import type { VirtualSelectContextValue } from './VirtualSelectContext.types';

export const VirtualSelectContext = createContext<
  undefined | VirtualSelectContextValue
>(undefined);

VirtualSelectContext.displayName = 'VirtualSelectContext';
