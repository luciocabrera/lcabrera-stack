import { use } from 'react';

import type { TableDataContextValue } from '../TableDataContext.types.ts';

import { TableDataContext } from '../TableDataContext.context.ts';

export const useTableDataContextValue = <TData = Record<string, unknown>>() => {
  const context = use(TableDataContext);

  return context as TableDataContextValue<TData>;
};
