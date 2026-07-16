import { use } from 'react';

import { VirtualListContext } from './VirtualListContext.context';

export const useVirtualListContextValue = () => {
  const context = use(VirtualListContext);

  if (context === undefined) {
    throw new Error(
      'useVirtualListContextValue must be used within VirtualListProvider (or VirtualSelectProvider)',
    );
  }

  return context;
};
