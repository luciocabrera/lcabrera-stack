import { use } from 'react';

import type { TableWrapperContextValue } from './TableWrapperContext.types';

import { TableWrapperContext } from './TableWrapperContext.context';

export const useTableWrapperRef = (): TableWrapperContextValue['wrapperRef'] => {
  const context = use(TableWrapperContext);

  if (!context) {
    throw new Error(
      'useTableWrapperRef must be used within TableWrapperProvider',
    );
  }

  return context.wrapperRef;
};
