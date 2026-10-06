import { use, useRef } from 'react';

import { logger } from '#ui/utils/logger';

import type { TableCellRenderingProviderProps } from './TableCellRenderingContext.types';

import { TableCellRenderingContext } from './TableCellRenderingContext.context';

export const TableCellRenderingProvider = ({
  cellPalettes = [],
  cellRenderers = [],
  children,
}: TableCellRenderingProviderProps) => {
  const parent = use(TableCellRenderingContext);
  const warnedRef = useRef(new Set<string>());

  const warnOnce = (message: string) => {
    if (warnedRef.current.has(message)) return;
    warnedRef.current.add(message);
    logger.warn(message);
  };

  const value = {
    palettes: [...parent.palettes, ...cellPalettes],
    renderers: [...parent.renderers, cellRenderers],
    warnOnce: parent.warnOnce ?? warnOnce,
  };

  return (
    <TableCellRenderingContext value={value}>
      {children}
    </TableCellRenderingContext>
  );
};
