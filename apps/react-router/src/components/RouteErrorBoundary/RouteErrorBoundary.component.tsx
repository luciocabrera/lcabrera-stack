import * as stylex from '@stylexjs/stylex';
import { useNavigate, useRevalidator } from 'react-router';

import { Button } from '@/components/Button';
import { ErrorDescriptive } from '@/components/Icons';
import { Title } from '@/components/Title';

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

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <Title icon={icon}>{title}</Title>
      <ErrorDescriptive />
      <h2 {...stylex.props(styles.title)}>Error Loading Data</h2>
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
