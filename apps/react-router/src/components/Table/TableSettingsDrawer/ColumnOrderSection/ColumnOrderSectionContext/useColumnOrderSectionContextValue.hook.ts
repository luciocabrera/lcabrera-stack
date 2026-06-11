import { use } from 'react';

import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

export const useColumnOrderSectionContextValue =
  (): ColumnOrderSectionContextValue => {
    const context = use(ColumnOrderSectionContext);

    if (context === null) {
      throw new Error(
        'useColumnOrderSectionContextValue must be used within ColumnOrderSectionProvider',
      );
    }

    return context;
  };
