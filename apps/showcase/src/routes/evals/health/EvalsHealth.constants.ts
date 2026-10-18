import {
  RATE_LIMIT_ERROR_CLASS,
  SESSION_LIMIT_ERROR_CLASS,
} from '@repo/eval-history/envelope/envelope.constants';

export const RATE_LIMIT_CLASSES: readonly string[] = [
  RATE_LIMIT_ERROR_CLASS,
  SESSION_LIMIT_ERROR_CLASS,
];

export const UNCLASSIFIED = 'unclassified';
