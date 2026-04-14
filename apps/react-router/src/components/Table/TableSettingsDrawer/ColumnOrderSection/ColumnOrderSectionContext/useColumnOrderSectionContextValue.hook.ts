import { use } from 'react';

import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';

export const useColumnOrderSectionContextValue = () => {
  const context = use(ColumnOrderSectionContext);

  return context;
};
