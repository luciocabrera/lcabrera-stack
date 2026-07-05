import { RootErrorBoundary } from '@repo/ui/components/RootErrorBoundary';

import type { Route } from '../+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RootErrorBoundary error={error} />
);
