import type { ReactNode } from 'react';

export type RouteErrorBoundaryProps = {
  readonly defaultMessage: string;
  readonly error: unknown;
  readonly icon?: ReactNode;
  readonly title?: string;
};
