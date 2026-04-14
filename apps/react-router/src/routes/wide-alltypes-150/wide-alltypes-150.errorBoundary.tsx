import type { Route } from './+types/root';

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RouteErrorBoundary
    defaultMessage='Failed to load Wide All-Types 150 data. Please try again.'
    error={error}
  />
);
