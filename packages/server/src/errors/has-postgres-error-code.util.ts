type HasPostgresErrorCodeArgs = {
  readonly code: string;
  readonly error: unknown;
};

/**
 * True when `error` is a node-postgres rejection carrying SQLSTATE `code` (e.g.
 * Narrows structurally rather than with `instanceof pg.DatabaseError`, and that is the
 * load-bearing part: a consumer can easily resolve two copies of `pg` — its own plus a
 * transitive one — and then `instanceof` is false for an error that must still be
 * recognised.
 */
export const hasPostgresErrorCode = ({
  code,
  error,
}: HasPostgresErrorCodeArgs) =>
  error instanceof Error && 'code' in error && error.code === code;
