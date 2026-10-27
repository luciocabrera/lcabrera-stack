/**
 * Private to `errors/`: the SQLSTATE codes `mapDbError` translates — Postgres' own
 * values, not names of ours — and the fixed sentence each query refusal serialises to.
 * Exporting a growing catalogue of SQLSTATEs from a published package would be surface
 * with no behaviour behind it.
 */
import type { QueryRefusalReason } from './errors.types.ts';

export const SQLSTATE_FOREIGN_KEY_VIOLATION = '23503';
export const SQLSTATE_UNIQUE_VIOLATION = '23505';
export const SQLSTATE_QUERY_CANCELED = '57014';

export const QUERY_REFUSED_MESSAGES: Readonly<
  Record<QueryRefusalReason, string>
> = {
  'column-not-allowed': 'The request named a column this query does not allow.',
  'keyset-cursor-mismatch':
    'The request sent a cursor that does not match its sort.',
  'keyset-sort-missing': 'The request sent a cursor without a sort.',
  'keyset-sort-not-unique':
    'The request sent a cursor with a sort that does not end on the unique column.',
  'keyset-unique-value-missing':
    'The request sent a cursor with no value for the unique column.',
};
