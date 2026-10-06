import { errorCode } from './errorCode.util.ts';

export const errorReason = (error: unknown): string => {
  if (error instanceof AggregateError && error.errors.length > 0) {
    return errorReason(error.errors[0]);
  }

  const message = error instanceof Error ? error.message : String(error);
  const code = errorCode(error);

  if (!code) {
    return message;
  }

  return message.includes(code) ? message : `${code}: ${message}`;
};
