import { use } from 'react';

import { VirtualSelectContext } from './VirtualSelectContext.context';

export const useVirtualSelectContextValue = () => {
  const context = use(VirtualSelectContext);

  if (context === undefined) {
    throw new Error(
      'useVirtualSelectContextValue must be used within VirtualSelectProvider',
    );
  }

  return context;
};
