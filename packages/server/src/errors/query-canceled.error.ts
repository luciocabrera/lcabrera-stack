import type { PgErrorFields } from './errors.types.ts';

import { PersistenceError } from './persistence.error.ts';

type QueryCanceledErrorArgs = {
  readonly cause: unknown;
  readonly fields: PgErrorFields;
};

export class QueryCanceledError extends PersistenceError {
  public constructor({ cause, fields }: QueryCanceledErrorArgs) {
    super({
      cause,
      fields,
      message:
        'The database stopped the query before it finished. Narrow it and try again.',
    });
    this.name = 'QueryCanceledError';
  }
}
