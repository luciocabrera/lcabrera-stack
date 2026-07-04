import { use } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';

export const useTableConfigContextValue = <
  TData = Record<string, unknown>,
>(): TableConfigContextValue<TData> => {
  const context = use(TableConfigContext);

  if (context === null) {
    throw new Error(
      'useTableConfigContextValue must be used within TableConfigProvider',
    );
  }

  return context as TableConfigContextValue<TData>;
};
