/**
 * Why `GroupingRefusedError` refused a grouped read. Distinguishable on purpose:
 * the edge renders a different sentence for "that column cannot be a group key"
 * than for "this grouping would return too much", and neither is a driver
 * failure.
 *
 * `row-limit-reached` is the only one raised **after** execution — it is the
 * backstop for a table whose statistics could not produce a pre-flight bound.
 */
export type GroupingRefusalReason =
  | 'aggregate-not-legal'
  | 'column-not-groupable'
  | 'duplicate-keys'
  | 'estimate-too-large'
  | 'no-keys'
  | 'row-limit-reached'
  | 'too-many-keys'
  | 'unknown-column';

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

/**
 * What a loader or action may put in its payload in place of one of this
 * package's error classes.
 *
 * Plain data by construction — no prototype, no methods, no `cause` chain — for
 * one reason: React Router single fetch drops functions silently, so an
 * `instanceof` check on the client is always false and the class arrives as an
 * unrecognisable shape (ADR-050, ADR-066). `kind` is the discriminant the edge
 * branches on instead.
 *
 * `message` is always this package's own sentence, never the driver's — the
 * translation layer has already withheld pg's message and its value-quoting
 * `detail` line before anything reaches here.
 */
export type SerializableDbError =
  | {
      /** The raw SQLSTATE, when the driver supplied one. Never the message. */
      readonly code?: string;
      readonly kind: 'db-failed';
      readonly message: string;
    }
  | {
      readonly column?: string;
      readonly estimatedRows?: number;
      readonly kind: 'grouping-refused';
      readonly message: string;
      readonly reason: GroupingRefusalReason;
    }
  | { readonly kind: 'db-canceled'; readonly message: string }
  | { readonly kind: 'unexpected'; readonly message: string };
