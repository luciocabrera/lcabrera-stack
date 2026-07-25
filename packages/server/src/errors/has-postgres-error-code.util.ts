type HasPostgresErrorCodeArgs = {
  readonly code: string;
  readonly error: unknown;
};

/**
 * True when `error` is a node-postgres rejection carrying SQLSTATE `code` (e.g.
 * `55000` — `object_not_in_prerequisite_state`, raised by CQMS' trigger guards).
 *
 * Narrows structurally rather than with `instanceof pg.DatabaseError`, and that
 * is the load-bearing part: a consumer can easily resolve two copies of `pg` —
 * its own plus a transitive one — and then `instanceof` is false for an error
 * that must still be recognised. Structural narrowing also means this works on a
 * rejection that crossed a worker or serialization boundary.
 *
 * Generic over the code on purpose: `mapDbError` names the two classes it
 * translates, and everything else branches through here with its own literal.
 */
export const hasPostgresErrorCode = ({
  code,
  error,
}: HasPostgresErrorCodeArgs) =>
  error instanceof Error && 'code' in error && error.code === code;
