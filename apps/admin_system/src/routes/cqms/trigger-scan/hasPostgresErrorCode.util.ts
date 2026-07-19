type HasPostgresErrorCodeArgs = {
  readonly code: string;
  readonly error: unknown;
};

/**
 * True when `error` is a node-postgres error carrying the given SQLSTATE `code`
 * (e.g. `55000` — `object_not_in_prerequisite_state`, the ERRCODE the trigger
 * guards raise, migrations 0021/0027). pg errors are `Error` instances with a
 * string `code`; this narrows `unknown` without importing pg's error type, so an
 * action can branch on a specific rejection instead of stringifying every error.
 */
export const hasPostgresErrorCode = ({
  code,
  error,
}: HasPostgresErrorCodeArgs) =>
  error instanceof Error && 'code' in error && error.code === code;
