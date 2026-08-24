import type { DatabaseError } from 'pg';

import type { PgErrorFields } from './errors.types.ts';

export const readPgErrorFields = (error: unknown): PgErrorFields => {
  const source: Partial<Omit<DatabaseError, 'name'>> =
    error instanceof Error ? error : {};

  return {
    code: source.code,
    column: source.column,
    constraint: source.constraint,
  };
};
