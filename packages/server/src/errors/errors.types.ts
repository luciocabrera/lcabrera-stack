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

export type PgErrorFields = {
  readonly code?: string;
  readonly column?: string;
  readonly constraint?: string;
};

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
