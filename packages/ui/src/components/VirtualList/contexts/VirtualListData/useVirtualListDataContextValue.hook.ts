import { use } from 'react';

import { VirtualListDataContext } from './VirtualListDataContext.context';

export const useVirtualListDataContextValue = () => {
  const context = use(VirtualListDataContext);

  if (context === undefined) {
    throw new Error(
      'useVirtualListDataContextValue must be used within VirtualListDataProvider',
    );
  }

  return context;
};
