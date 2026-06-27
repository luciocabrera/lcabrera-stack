import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { useNotifyOnError } from '@/hooks';

import type { Route } from './+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  useNotifyOnError(error);
  return (
    <RouteErrorBoundary
      defaultMessage='Failed to load Wide All-Types 150 data. Please try again.'
      error={error}
    />
  );
};
