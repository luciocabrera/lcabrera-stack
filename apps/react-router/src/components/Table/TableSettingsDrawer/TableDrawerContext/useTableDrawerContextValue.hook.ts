import { use } from 'react';

import { TableDrawerContext } from './TableDrawerContext.context.ts';

export const useTableDrawerContextValue = () => {
  const context = use(TableDrawerContext);

  return context;
};
