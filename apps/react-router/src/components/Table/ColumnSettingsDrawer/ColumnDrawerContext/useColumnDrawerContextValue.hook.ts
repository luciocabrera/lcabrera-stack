import { use } from 'react';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

import { ColumnDrawerContext } from './ColumnDrawerContext.context';

export const useColumnDrawerContextValue = <
  TData = Record<string, unknown>,
>(): ColumnDrawerContextValue<TData> => {
  const context = use(ColumnDrawerContext);

  if (context === null) {
    throw new Error(
      'useColumnDrawerContextValue must be used within ColumnDrawerProvider',
    );
  }

  return context as ColumnDrawerContextValue<TData>;
};
