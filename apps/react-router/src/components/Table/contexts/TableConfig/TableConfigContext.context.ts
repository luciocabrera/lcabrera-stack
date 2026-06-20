import { createContext } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

export const TableConfigContext = createContext<null | TableConfigContextValue>(
  null,
);

TableConfigContext.displayName = 'TableConfigContext';
