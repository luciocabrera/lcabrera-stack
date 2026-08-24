type HasPostgresErrorCodeArgs = {
  readonly code: string;
  readonly error: unknown;
};

/**
 * True when `error` is a node-postgres rejection carrying SQLSTATE `code`.
 * Narrows structurally rather than with `instanceof pg.DatabaseError`: a consumer can
 * resolve two copies of `pg`, and then `instanceof` is false for an error that must still
 * be recognised.
 */
export const hasPostgresErrorCode = ({
  code,
  error,
}: HasPostgresErrorCodeArgs) =>
  error instanceof Error && 'code' in error && error.code === code;
