import { use } from 'react';

import { GlobalSettingsContext } from './GlobalSettingsContext.context';

import type { GlobalSettingsContextValue } from './GlobalSettingsContext.types';

export const useGlobalSettingsContextValue = (): GlobalSettingsContextValue => {
  const context = use(GlobalSettingsContext);

  if (context === null) {
    throw new Error(
      'useGlobalSettingsContextValue must be used within GlobalSettingsProvider',
    );
  }

  return context;
};
