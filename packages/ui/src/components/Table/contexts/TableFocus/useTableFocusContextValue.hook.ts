import { use } from 'react';

import { TableFocusContext } from './TableFocusContext.context';

export const useTableFocusContextValue = () => {
  const context = use(TableFocusContext);

  if (context === undefined) {
    throw new Error(
      'useTableFocusContextValue must be used within TableFocusProvider',
    );
  }

  return context;
};
