import { use } from 'react';

import { TableDataContext } from '../TableDataContext.context';

export const useTableDataContextValue = () => {
  const context = use(TableDataContext);

  return context;
};
