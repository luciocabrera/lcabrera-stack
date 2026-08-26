import { RouteErrorBoundary, useNotifyOnError } from '@lcabrera/ui';

import type { Route } from './+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  useNotifyOnError(error);
  return (
    <RouteErrorBoundary
      defaultMessage='Failed to load car sales data. Please try again.'
      error={error}
    />
  );
};
