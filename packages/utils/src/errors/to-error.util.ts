export const toError = (error: unknown) => {
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
