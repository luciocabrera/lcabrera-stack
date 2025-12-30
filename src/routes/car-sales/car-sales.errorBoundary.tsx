import * as stylex from '@stylexjs/stylex';

import type { Route } from './+types/car-sales';

import { styles } from './car-sales.errorBoundary.stylex';

/**
 * Error boundary for the car-sales route.
 * Catches errors from loader and component rendering.
 */
export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  let details = 'Failed to load car sales data. Please try again.';

  if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
  }

  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.title)}>Error Loading Data</h2>
      <p>{details}</p>
      <button
        onClick={() => { globalThis.location.reload(); }}
        type='button'
        {...stylex.props(styles.retryButton)}
      >
        Retry
      </button>
    </div>
  );
};
