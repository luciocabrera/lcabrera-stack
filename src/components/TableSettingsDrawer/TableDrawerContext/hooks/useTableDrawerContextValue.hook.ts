import { use } from 'react';

import { TableDrawerContext } from '../TableDrawerContext.context';

export const useTableDrawerContextValue = () => {
  const context = use(TableDrawerContext);

  return context;
};
