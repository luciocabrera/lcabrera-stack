import * as stylex from "@stylexjs/stylex";

import type { Route } from "./+types/root.ts";

import { styles } from "./enterprise-orders.errorBoundary.stylex.ts";

/**
 * Error boundary for the enterprise-orders route.
 * Catches errors from loader and component rendering.
 */
export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  let details = "Failed to load enterprise orders data. Please try again.";

  if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
  }

  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.title)}>Error Loading Data</h2>
      <p>{details}</p>
      <button
        onClick={() => {
          globalThis.location.reload();
        }}
        type="button"
        {...stylex.props(styles.retryButton)}
      >
        Retry
      </button>
    </div>
  );
};
