import { use } from 'react';

import type { GlobalSettingsContextValue } from './GlobalSettingsContext.types';

import { GlobalSettingsContext } from './GlobalSettingsContext.context';

export const useGlobalSettingsContextValue = (): GlobalSettingsContextValue => {
  const context = use(GlobalSettingsContext);

  if (context === undefined) {
    throw new Error(
      'useGlobalSettingsContextValue must be used within GlobalSettingsProvider',
    );
  }

  return context;
};
