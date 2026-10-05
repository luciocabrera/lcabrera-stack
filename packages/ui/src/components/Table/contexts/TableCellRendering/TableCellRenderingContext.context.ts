import { createContext } from 'react';

import type { TableCellRenderingContextValue } from './TableCellRenderingContext.types';

export const TableCellRenderingContext =
  createContext<TableCellRenderingContextValue>({
    palettes: [],
    renderers: [],
  });

TableCellRenderingContext.displayName = 'TableCellRenderingContext';
