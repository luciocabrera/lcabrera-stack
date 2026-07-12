type GetErrorMessageArgs = {
  readonly error: unknown;
  readonly fallback?: string;
};

/**
 * Returns the error message string for a caught value.
 *
 * Uses `error.message` when the value is an `Error` instance,
 * otherwise returns the `fallback` string (defaults to `'An error occurred'`).
 */
export const getErrorMessage = ({
  error,
  fallback = 'An error occurred',
}: GetErrorMessageArgs) => (error instanceof Error ? error.message : fallback);
