import { use } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';

export const useTableConfigContextValue = <TData = unknown>() => {
  const context = use(TableConfigContext);

  return context as TableConfigContextValue<TData>;
};
