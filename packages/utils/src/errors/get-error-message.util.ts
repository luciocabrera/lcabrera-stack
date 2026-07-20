type GetErrorMessageArgs = {
  readonly error: unknown;
  readonly fallback?: string;
};

/**
 * Returns the error message string for a caught value.
 *
 * Uses `error.message` when the value is an `Error` instance, otherwise
 * returns the `fallback` string (defaults to `'An error occurred'`).
 *
 * `catch` binds `unknown`, so every caller that wants to surface a message —
 * a route action returning a typed error to its page, a Table fetch action
 * writing one into the store — needs this same narrowing. Keeping it in one
 * tested place is what stops the ternary being rewritten per call site.
 */
export const getErrorMessage = ({
  error,
  fallback = 'An error occurred',
}: GetErrorMessageArgs) => (error instanceof Error ? error.message : fallback);
