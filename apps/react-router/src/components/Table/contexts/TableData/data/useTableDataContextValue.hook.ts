import { use } from 'react';

import type { TableDataContextValue } from '../TableDataContext.types';

import { TableDataContext } from '../TableDataContext.context';

export const useTableDataContextValue = <TData = Record<string, unknown>>() => {
  const context = use(TableDataContext);

  return context as TableDataContextValue<TData>;
};
