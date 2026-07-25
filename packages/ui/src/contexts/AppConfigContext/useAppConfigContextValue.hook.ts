import { use } from 'react';

import type { AppConfigContextValue } from './AppConfigContext.types';

import { AppConfigContext } from './AppConfigContext.context';

export const useAppConfigContextValue = (): AppConfigContextValue => {
  const context = use(AppConfigContext);

  if (!context) {
    throw new Error(
      'useAppConfigContextValue must be used within AppConfigProvider',
    );
  }

  return context;
};
