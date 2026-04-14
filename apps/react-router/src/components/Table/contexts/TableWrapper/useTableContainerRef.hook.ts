import { use } from 'react';

import type { TableWrapperContextValue } from './TableWrapperContext.types';

import { TableWrapperContext } from './TableWrapperContext.context';

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
