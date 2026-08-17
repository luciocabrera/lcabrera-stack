import type { SortRule } from 'api-shared';

import { DEFAULT_PAGE_LIMIT, MAX_CAR_SALES_LIMIT } from 'api-shared';

import { CAR_SALES_SORTABLE_COLUMNS } from './carSales.constants';

/**
 * TypeScript type for the validated /paginated querystring.
 */
export type PaginatedCarSalesQuery = {
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly SortRule[];
};

/**
 * JSON Schema for the /paginated querystring.
 *
 * Fastify validates and coerces query params at the framework level,
 * replacing Zod schemas from the Express version.
 */
export const paginatedCarSalesQuerySchema = {
  properties: {
    limit: {
      default: DEFAULT_PAGE_LIMIT,
      maximum: MAX_CAR_SALES_LIMIT,
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
            enum: [...CAR_SALES_SORTABLE_COLUMNS],
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
