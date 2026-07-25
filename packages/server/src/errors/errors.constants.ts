/**
 * The SQLSTATE codes `mapDbError` translates — Postgres' class 23 (integrity
 * constraint violation) values, not names of ours.
 *
 * Private to this folder: a consumer that needs a code this package does not
 * translate passes its own literal to `hasPostgresErrorCode`, which is generic
 * over the code by design. Exporting a growing catalogue of SQLSTATEs from a
 * published package would be surface with no behaviour behind it.
 */
export const SQLSTATE_FOREIGN_KEY_VIOLATION = '23503';
export const SQLSTATE_UNIQUE_VIOLATION = '23505';
