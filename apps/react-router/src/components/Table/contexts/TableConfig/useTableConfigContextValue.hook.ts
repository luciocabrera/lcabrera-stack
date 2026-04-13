import { use } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types.ts';

import { TableConfigContext } from './TableConfigContext.context.ts';

export const useTableConfigContextValue = <
  TData = Record<string, unknown>,
>() => {
  const context = use(TableConfigContext);

  return context as TableConfigContextValue<TData>;
};
