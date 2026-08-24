/**
 * Why `GroupingRefusedError` refused a grouped read.
 * Distinguishable on purpose: the edge renders a different sentence for "that column
 * cannot be a group key" than for "this grouping would return too much", and neither is a
 * driver failure.
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
 * `constraint` and `column` are what lets a consumer route a violation to the right form
 * field instead of a hard-coded one; `code` is the raw SQLSTATE for a consumer that needs
 * a class this package does not name.
 * All three are optional because Postgres populates them per SQLSTATE class — a unique
 * violation names the `constraint` and no `column`, a `not_null_violation` names the
 * `column` and no `constraint`.
 */
export type PgErrorFields = {
  readonly code?: string;
  readonly column?: string;
  readonly constraint?: string;
};

/**
 * Plain data by construction — no prototype, no methods, no `cause` chain — for one
 * reason: React Router single fetch drops functions silently, so an `instanceof` check on
 * the client is always false and the class arrives as an unrecognisable shape (ADR-050,
 * ADR-066).
 * `message` is always this package's own sentence, never the driver's — the translation
 * layer has already withheld pg's message and its value-quoting `detail` line before
 * anything reaches here.
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
