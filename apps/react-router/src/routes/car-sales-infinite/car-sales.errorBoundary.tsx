import type { Route } from './+types/root.ts';

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RouteErrorBoundary
    defaultMessage='Failed to load car sales data. Please try again.'
    error={error}
  />
);
