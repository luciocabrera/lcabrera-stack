import { use } from 'react';

import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';

export const useColumnOrderSectionContextValue = () => {
  const context = use(ColumnOrderSectionContext);

  if (context === undefined) {
    throw new Error(
      'useColumnOrderSectionContextValue must be used within ColumnOrderSectionProvider',
    );
  }

  return context;
};
