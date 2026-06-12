import { use } from 'react';

import { ColumnDrawerContext } from './ColumnDrawerContext.context';
import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

export const useColumnDrawerContextValue = (): ColumnDrawerContextValue => {
  const context = use(ColumnDrawerContext);

  if (context === null) {
    throw new Error(
      'useColumnDrawerContextValue must be used within ColumnDrawerProvider',
    );
  }

  return context;
};
