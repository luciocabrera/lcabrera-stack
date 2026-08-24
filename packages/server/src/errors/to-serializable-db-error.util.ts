import type { SerializableDbError } from './errors.types.ts';

import { GroupingRefusedError } from './grouping-refused.error.ts';
import { PersistenceError } from './persistence.error.ts';
import { QueryCanceledError } from './query-canceled.error.ts';

const UNEXPECTED_MESSAGE = 'The request could not be completed.';

/**
 * The reason this exists rather than "just return the error": React Router single fetch
 * drops functions, so a class instance loses its prototype on the way to the client and
 * every `instanceof` there is false — silently, with no error anywhere (ADR-050).
 * The fallback arm is deliberately message-free of the original: an untranslated throw is
 * by definition one this package did not vet, so forwarding its text would reopen exactly
 * the leak `PersistenceError` closes.
 */
export const toSerializableDbError = (error: unknown): SerializableDbError => {
  if (error instanceof GroupingRefusedError) {
    return {
      kind: 'grouping-refused',
      message: error.message,
      reason: error.reason,
      ...(error.column !== undefined && { column: error.column }),
      ...(error.estimatedRows !== undefined && {
        estimatedRows: error.estimatedRows,
      }),
    };
  }

  // Before the `PersistenceError` arm, which it extends.
  if (error instanceof QueryCanceledError) {
    return { kind: 'db-canceled', message: error.message };
  }

  if (error instanceof PersistenceError) {
    return {
      kind: 'db-failed',
      message: error.message,
      ...(error.fields.code !== undefined && { code: error.fields.code }),
    };
  }

  return { kind: 'unexpected', message: UNEXPECTED_MESSAGE };
};
