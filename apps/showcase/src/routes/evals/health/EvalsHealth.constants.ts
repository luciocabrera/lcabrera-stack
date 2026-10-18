import { SESSION_LIMIT_ERROR_CLASS } from '@repo/eval-history/envelope/envelope.constants';

export const RATE_LIMIT_CLASSES: readonly string[] = [
  'rate_limit',
  SESSION_LIMIT_ERROR_CLASS,
];

export const UNCLASSIFIED = 'unclassified';
