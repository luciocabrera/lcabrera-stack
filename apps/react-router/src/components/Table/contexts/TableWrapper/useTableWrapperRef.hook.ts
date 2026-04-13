import { use } from 'react';

import type { TableWrapperContextValue } from './TableWrapperContext.types.ts';

import { TableWrapperContext } from './TableWrapperContext.context.ts';

export const useTableWrapperRef =
  (): TableWrapperContextValue['wrapperRef'] => {
    const context = use(TableWrapperContext);

    if (!context) {
      throw new Error(
        'useTableWrapperRef must be used within TableWrapperProvider',
      );
    }

    return context.wrapperRef;
  };
