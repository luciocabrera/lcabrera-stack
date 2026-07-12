import { use } from 'react';

import { SettingsDraftContext } from './SettingsDraftContext.context';

export const useSettingsDraftContextValue = () => {
  const context = use(SettingsDraftContext);

  if (context === undefined) {
    throw new Error(
      'useSettingsDraftContextValue must be used within SettingsDraftProvider',
    );
  }

  return context;
};
