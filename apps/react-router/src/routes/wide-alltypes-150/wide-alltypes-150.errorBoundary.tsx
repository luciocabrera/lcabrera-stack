import * as stylex from "@stylexjs/stylex";

import type { Route } from "./+types/root.ts";

import { styles } from "./wide-alltypes-150.errorBoundary.stylex.ts";

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  let details = "Failed to load Wide All-Types 150 data. Please try again.";
  if (import.meta.env.DEV && error instanceof Error) {
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
