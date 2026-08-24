type GetErrorMessageArgs = {
  readonly error: unknown;
  readonly fallback?: string;
};

export const getErrorMessage = ({
  error,
  fallback = 'An error occurred',
}: GetErrorMessageArgs) => (error instanceof Error ? error.message : fallback);
