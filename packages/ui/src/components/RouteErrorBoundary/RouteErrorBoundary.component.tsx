import { Button } from '@repo/ui/components/Button';
import { ErrorDescriptive } from '@repo/ui/components/Icons';
import { Title } from '@repo/ui/components/Title';
import * as stylex from '@stylexjs/stylex';
import { useNavigate, useRevalidator } from 'react-router';

import type { RouteErrorBoundaryProps } from './RouteErrorBoundary.types';

import { styles } from './RouteErrorBoundary.stylex';

export const RouteErrorBoundary = ({
  defaultMessage,
  error,
  icon,
  title = 'An error occurred',
}: RouteErrorBoundaryProps) => {
  const { revalidate } = useRevalidator();
  const navigate = useNavigate();

  const details =
    import.meta.env.DEV && error instanceof Error
      ? error.message
      : defaultMessage;

  const handleNavigateHome = async () => {
    await navigate('/');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <Title icon={icon}>{title}</Title>
      <ErrorDescriptive />
      <p>{details}</p>
      <div {...stylex.props(styles.actions)}>
        <Button onClick={handleNavigateHome} variant='primary'>
          Home
        </Button>
        <Button onClick={revalidate} variant='outline'>
          Retry
        </Button>
      </div>
    </div>
  );
};
