import type { SortRule } from 'api-shared';

import { DEFAULT_PAGE_LIMIT, MAX_WIDE_ALLTYPES_LIMIT } from 'api-shared';

import { WIDE_ALLTYPES_SORTABLE_COLUMNS } from './wideAlltypes150.constants';

/**
 * TypeScript type for the /paginated querystring.
 */
export type PaginatedWideAlltypesQuery = {
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly SortRule[];
};

/**
 * JSON Schema for the /paginated querystring.
 *
 * Replaces the Zod-based `parseWideAlltypesSorting` from the Express version.
 */
export const paginatedWideAlltypesQuerySchema = {
  properties: {
    limit: {
      default: DEFAULT_PAGE_LIMIT,
      maximum: MAX_WIDE_ALLTYPES_LIMIT,
      minimum: 1,
      type: 'integer',
    },
    skip: { default: 0, minimum: 0, type: 'integer' },
    sort: {
      default: [],
      items: {
        additionalProperties: false,
        properties: {
          columnKey: {
            enum: [...WIDE_ALLTYPES_SORTABLE_COLUMNS],
            type: 'string',
          },
          direction: { enum: ['asc', 'desc'], type: 'string' },
        },
        required: ['columnKey', 'direction'],
        type: 'object',
      },
      type: 'array',
    },
  },
  type: 'object',
};
