import { RootErrorBoundary } from '@repo/ui';

import type { Route } from '../+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RootErrorBoundary error={error} />
);
