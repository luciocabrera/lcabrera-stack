import { DISTINCT_DEFAULT_LIMIT } from 'api-shared';

/**
 * TypeScript type for the /api/distinct querystring.
 */
export type DistinctQuery = {
  readonly columnName: string;
  readonly limit: number;
  readonly offset: number;
  readonly schemaName: string;
  readonly tableName: string;
};

/**
 * JSON Schema for the /api/distinct querystring. Validates presence and
 * types only — source authorization (allow-list) lives in
 * parseDistinctSource so the registry stays the single source of truth.
 */
export const distinctQuerySchema = {
  properties: {
    columnName: { minLength: 1, type: 'string' },
    limit: { default: DISTINCT_DEFAULT_LIMIT, minimum: 1, type: 'integer' },
    offset: { default: 0, minimum: 0, type: 'integer' },
    schemaName: { minLength: 1, type: 'string' },
    tableName: { minLength: 1, type: 'string' },
  },
  required: ['columnName', 'schemaName', 'tableName'],
  type: 'object',
};
