import { use } from 'react';

import type { NotificationContextValue } from './NotificationContext.types';

import { NotificationContext } from './NotificationContext.context';

export const useNotificationContextValue = (): NotificationContextValue => {
  const context = use(NotificationContext);

  if (context === undefined) {
    throw new Error(
      'useNotificationContextValue must be used within NotificationProvider',
    );
  }

  return context;
};
