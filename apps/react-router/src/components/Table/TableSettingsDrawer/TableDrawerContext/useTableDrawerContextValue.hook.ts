import { use } from 'react';

import { TableDrawerContext } from './TableDrawerContext.context';
import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const useTableDrawerContextValue = <
  TData = Record<string, unknown>,
>(): TableDrawerContextValue<TData> => {
  const context = use(TableDrawerContext);

  if (context === null) {
    throw new Error(
      'useTableDrawerContextValue must be used within TableDrawerProvider',
    );
  }

  return context as TableDrawerContextValue<TData>;
};
