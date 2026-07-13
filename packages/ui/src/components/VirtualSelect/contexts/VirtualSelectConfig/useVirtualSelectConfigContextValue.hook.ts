import { use } from 'react';

import { VirtualSelectConfigContext } from './VirtualSelectConfigContext.context';

export const useVirtualSelectConfigContextValue = () => {
  const context = use(VirtualSelectConfigContext);

  if (context === undefined) {
    throw new Error(
      'useVirtualSelectConfigContextValue must be used within VirtualSelectConfigProvider',
    );
  }

  return context;
};
