const codeOf = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : undefined;

export const errorReason = (error: unknown): string => {
  if (error instanceof AggregateError && error.errors.length > 0) {
    return errorReason(error.errors[0]);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = codeOf(error);

  if (!code) {
    return message;
  }

  return message.includes(code) ? message : `${code}: ${message}`;
};
