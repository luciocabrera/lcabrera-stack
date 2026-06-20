import { use } from 'react';

import type { ColumnOrderSectionContextValue } from './ColumnOrderSectionContext.types';

import { ColumnOrderSectionContext } from './ColumnOrderSectionContext.context';

export const useColumnOrderSectionContextValue =
  (): ColumnOrderSectionContextValue => {
    const context = use(ColumnOrderSectionContext);

    if (context === undefined) {
      throw new Error(
        'useColumnOrderSectionContextValue must be used within ColumnOrderSectionProvider',
      );
    }

    return context;
  };
