import { use } from 'react';

import { ColumnDrawerContext } from './ColumnDrawerContext.context.ts';

export const useColumnDrawerContextValue = () => {
  const context = use(ColumnDrawerContext);

  return context;
};
