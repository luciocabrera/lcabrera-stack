import { use } from 'react';

import { TableDrawerContext } from './TableDrawerContext.context';
import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const useTableDrawerContextValue = <
  TData = Record<string, unknown>,
>() => {
  const context = use(TableDrawerContext);

  return context as TableDrawerContextValue<TData>;
};
