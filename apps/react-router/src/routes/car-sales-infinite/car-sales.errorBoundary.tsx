import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';

import type { Route } from './+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RouteErrorBoundary
    defaultMessage='Failed to load car sales data. Please try again.'
    error={error}
  />
);
