import { RootErrorBoundary } from '@lcabrera/ui';

import type { Route } from '../+types/root';

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => (
  <RootErrorBoundary error={error} />
);
