import { use } from 'react';

import { VirtualListConfigContext } from './VirtualListConfigContext.context';

export const useVirtualListConfigContextValue = () => {
  const context = use(VirtualListConfigContext);

  if (context === undefined) {
    throw new Error(
      'useVirtualListConfigContextValue must be used within VirtualListConfigProvider',
    );
  }

  return context;
};
