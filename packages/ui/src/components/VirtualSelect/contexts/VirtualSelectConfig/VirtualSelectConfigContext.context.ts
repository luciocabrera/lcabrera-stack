import { createContext } from 'react';

import type { VirtualSelectConfigContextValue } from './VirtualSelectConfigContext.types';

export const VirtualSelectConfigContext = createContext<
  undefined | VirtualSelectConfigContextValue
>(undefined);

VirtualSelectConfigContext.displayName = 'VirtualSelectConfigContext';
