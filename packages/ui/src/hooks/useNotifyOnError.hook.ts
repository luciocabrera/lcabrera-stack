import { useEffect } from 'react';

import { useNotifyAction } from '@repo/ui/contexts/NotificationContext/actions';

const NOTIFY_ON_ERROR_DURATION_MS = 10_000;

/**
 * Fires a toast notification once whenever `error` changes identity.
 */
export const useNotifyOnError = (error: unknown) => {
  const notify = useNotifyAction();

  useEffect(() => {
    notify({
      durationMs: NOTIFY_ON_ERROR_DURATION_MS,
      message: 'Something went wrong.',
      title: 'Error occurred',
      variant: 'error',
    });
  }, [error, notify]);
};
