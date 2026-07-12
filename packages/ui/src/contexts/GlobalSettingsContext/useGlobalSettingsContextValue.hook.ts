import { use } from 'react';

import { GlobalSettingsContext } from './GlobalSettingsContext.context';

export const useGlobalSettingsContextValue = () => {
  const context = use(GlobalSettingsContext);

  if (context === undefined) {
    throw new Error(
      'useGlobalSettingsContextValue must be used within GlobalSettingsProvider',
    );
  }

  return context;
};
