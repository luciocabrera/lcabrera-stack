import * as stylex from '@stylexjs/stylex';

import type { RouteErrorBoundaryProps } from './RouteErrorBoundary.types';

import { styles } from './RouteErrorBoundary.stylex';

const handleRetryClick = (): void => {
  globalThis.location.reload();
};

export const RouteErrorBoundary = ({
  defaultMessage,
  error,
}: RouteErrorBoundaryProps) => {
  let details = defaultMessage;

  if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.title)}>Error Loading Data</h2>
      <p>{details}</p>
      <button
        onClick={handleRetryClick}
        type='button'
        {...stylex.props(styles.retryButton)}
      >
        Retry
      </button>
    </div>
  );
};
