/**
 * Normalizes the `unknown` values React's streaming callbacks (`onError`,
 * `onShellError`) can throw into a real `Error` so they log and reject
 * consistently.
 */
export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object') {
    return new Error(JSON.stringify(error));
  }

  return new Error('Unknown server-side streaming error');
};
