import { use } from 'react';

import type { TableWrapperContextValue } from './TableWrapperContext.types.ts';

import { TableWrapperContext } from './TableWrapperContext.context.ts';

export const useTableContainerRef =
  (): TableWrapperContextValue['containerRef'] => {
    const context = use(TableWrapperContext);

    if (!context) {
      throw new Error(
        'useTableContainerRef must be used within TableWrapperProvider',
      );
    }

    return context.containerRef;
  };
