import { use } from 'react';

import { ColumnDrawerContext } from './ColumnDrawerContext.context';

export const useColumnDrawerContextValue = () => {
  const context = use(ColumnDrawerContext);

  return context;
};
