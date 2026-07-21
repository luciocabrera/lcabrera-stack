import { RouteErrorBoundary } from '@lcabrera/ui/components/RouteErrorBoundary';
import { useNotifyOnError } from '@lcabrera/ui/hooks';

import type { Route } from './+types/root';

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
