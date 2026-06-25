import * as stylex from '@stylexjs/stylex';
import { useEffect } from 'react';
import { useNavigate, useRevalidator } from 'react-router';

import { Button } from '@/components/Button';
import { ErrorDescriptive } from '@/components/Icons';
import { Title } from '@/components/Title';
import { useNotifyAction } from '@/contexts/NotificationContext/actions';

import type { RouteErrorBoundaryProps } from './RouteErrorBoundary.types';

import { styles } from './RouteErrorBoundary.stylex';

const ERROR_NOTIFICATION_DURATION_MS = 10_000;

export const RouteErrorBoundary = ({
  defaultMessage,
  error,
  icon,
  title = 'An error occurred',
}: RouteErrorBoundaryProps) => {
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();
  const notify = useNotifyAction();

  useEffect(() => {
    notify({
      durationMs: ERROR_NOTIFICATION_DURATION_MS,
      message: 'Something went wrong.',
      title: 'Error occurred',
      variant: 'error',
    });
  }, [error, notify]);

  const details =
    import.meta.env.DEV && error instanceof Error
      ? error.message
      : defaultMessage;

  const handleNavigateHome = () => {
    void navigate('/');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <Title icon={icon}>{title}</Title>
      <ErrorDescriptive />
      <p>{details}</p>
      <div {...stylex.props(styles.actions)}>
        <Button color='primary' onClick={handleNavigateHome}>
          Home
        </Button>
        <Button color='outline' onClick={revalidate}>
          Retry
        </Button>
      </div>
    </div>
  );
};
