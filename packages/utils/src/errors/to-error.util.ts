export const toError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  return new Error(
    error && typeof error === 'object'
      ? JSON.stringify(error)
      : 'Unknown server-side streaming error',
  );
};
