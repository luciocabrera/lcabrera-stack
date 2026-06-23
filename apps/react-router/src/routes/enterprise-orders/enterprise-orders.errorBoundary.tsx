import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';

import type { Route } from './+types/root';

export const ErrorBoundary = ({ error, ...rest }: Route.ErrorBoundaryProps) => {
  console.log('Enterprise Orders ErrorBoundary error:', { error, rest });
  return (
    <RouteErrorBoundary
      defaultMessage='Failed to load enterprise orders data. Please try again.'
      error={error}
      title='Enterprise Orders Error'
      {...rest}
    />
  );
};
