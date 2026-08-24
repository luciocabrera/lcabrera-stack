/**
 * The SQLSTATE codes `mapDbError` translates — Postgres' own values, not names of ours.
 * Exporting a growing catalogue of SQLSTATEs from a published package would be surface
 * with no behaviour behind it.
 */
export const SQLSTATE_FOREIGN_KEY_VIOLATION = '23503';
export const SQLSTATE_UNIQUE_VIOLATION = '23505';
/**
 * Raised by `statement_timeout` **and** by `pg_cancel_backend`, which is why the error it
 * maps to is named for the SQLSTATE rather than for the timeout: the code says the query
 * stopped early, not why.
 */
export const SQLSTATE_QUERY_CANCELED = '57014';
