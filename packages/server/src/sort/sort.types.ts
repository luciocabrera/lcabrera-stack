/**
 * Duplicated from the client-safe packages (ADR-038, ADR-039). `direction` is
 * required: this is an ORDER BY input, and a rule with no direction has nothing
 * to emit.
 */

export type ColumnSort = {
  readonly columnKey: string;
  readonly direction: 'asc' | 'desc';
};
