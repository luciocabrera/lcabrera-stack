import { use } from 'react';

import { NotificationContext } from './NotificationContext.context';

import type { NotificationContextValue } from './NotificationContext.types';

export const useNotificationContextValue = (): NotificationContextValue => {
  const context = use(NotificationContext);

  if (context === undefined) {
    throw new Error(
      'useNotificationContextValue must be used within NotificationProvider',
    );
  }

  return context;
};
