import { RouteErrorBoundary } from '@repo/ui/components/RouteErrorBoundary';
import { useNotifyOnError } from '@repo/ui/hooks';

import type { Route } from './+types/layout';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  useNotifyOnError(error);
  return (
    <RouteErrorBoundary
      defaultMessage='Failed to load enterprise orders data. Please try again.'
      error={error}
      title='Enterprise Orders Error'
    />
  );
};
