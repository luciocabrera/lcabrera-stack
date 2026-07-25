/**
 * The `pg` diagnostic fields a translated error carries forward.
 *
 * `constraint` and `column` are what lets a consumer route a violation to the
 * right form field instead of a hard-coded one; `code` is the raw SQLSTATE for a
 * consumer that needs a class this package does not name. All three are optional
 * because Postgres populates them per SQLSTATE class — a unique violation names
 * the `constraint` and no `column`, a `not_null_violation` names the `column` and
 * no `constraint`.
 *
 * Deliberately **not** `detail`: pg's detail line quotes the offending values
 * (`Key (email)=(a@b.c) already exists`), which is precisely the leak this
 * translation layer exists to stop. It stays reachable through `Error.cause` for
 * server-side logging.
 */
export type PgErrorFields = {
  readonly code?: string;
  readonly column?: string;
  readonly constraint?: string;
};
