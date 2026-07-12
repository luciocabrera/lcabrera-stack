import { use } from 'react';

import { NotificationContext } from './NotificationContext.context';

export const useNotificationContextValue = () => {
  const context = use(NotificationContext);

  if (context === undefined) {
    throw new Error(
      'useNotificationContextValue must be used within NotificationProvider',
    );
  }

  return context;
};
