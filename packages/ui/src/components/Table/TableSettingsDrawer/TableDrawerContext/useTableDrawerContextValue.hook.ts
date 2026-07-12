import { use } from 'react';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

import { TableDrawerContext } from './TableDrawerContext.context';

export const useTableDrawerContextValue = <
  TData = Record<string, unknown>,
>() => {
  const context = use(TableDrawerContext);

  if (context === null) {
    throw new Error(
      'useTableDrawerContextValue must be used within TableDrawerProvider',
    );
  }

  return context as TableDrawerContextValue<TData>;
};
