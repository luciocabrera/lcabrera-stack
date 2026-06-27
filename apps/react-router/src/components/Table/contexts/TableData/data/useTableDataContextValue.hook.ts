import { use } from 'react';

import type { TableDataContextValue } from '../TableDataContext.types';

import { TableDataContext } from '../TableDataContext.context';

export const useTableDataContextValue = <
  TData = Record<string, unknown>,
>(): TableDataContextValue<TData> => {
  const context = use(TableDataContext);

  if (context === undefined) {
    throw new Error(
      'useTableDataContextValue must be used within TableDataProvider',
    );
  }

  return context as TableDataContextValue<TData>;
};
