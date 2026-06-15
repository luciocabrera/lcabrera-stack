import {
  DEFAULT_PAGE_LIMIT,
  DISTINCT_DEFAULT_LIMIT,
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_DISTINCT_COLUMNS,
} from 'api-shared';
import type { SortRule } from 'api-shared';

import type { EnterpriseOrdersFilters } from './enterpriseOrders.types';

const booleanFilterSchema = {
  type: 'object',
  required: ['type', 'value'],
  properties: {
    type: { const: 'boolean' },
    value: { type: 'boolean' },
  },
  additionalProperties: false,
};

const dateFilterSchema = {
  type: 'object',
  required: ['type', 'operator', 'value'],
  properties: {
    operator: {
      type: 'string',
      enum: ['after', 'before', 'between', 'equals'],
    },
    type: { const: 'date' },
    value: { type: 'string', minLength: 1 },
    value2: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

const numberFilterSchema = {
  type: 'object',
  required: ['type', 'operator', 'value'],
  properties: {
    operator: {
      type: 'string',
      enum: [
        'between',
        'equals',
        'greaterThan',
        'greaterThanOrEqual',
        'lessThan',
        'lessThanOrEqual',
        'notEquals',
      ],
    },
    type: { const: 'number' },
    value: { type: 'number' },
    value2: { type: 'number' },
  },
  additionalProperties: false,
};

const selectFilterSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    operator: { type: 'string', enum: ['equals', 'notEquals'] },
    type: { type: 'string', enum: ['multiSelect', 'select'] },
    value: { type: 'string', minLength: 1 },
    values: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
  additionalProperties: false,
};

const textFilterSchema = {
  type: 'object',
  required: ['type', 'operator', 'value'],
  properties: {
    operator: {
      type: 'string',
      enum: [
        'contains',
        'endsWith',
        'equals',
        'notContains',
        'notEquals',
        'startsWith',
      ],
    },
    type: { const: 'text' },
    value: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

const filterValueSchema = {
  oneOf: [
    booleanFilterSchema,
    dateFilterSchema,
    numberFilterSchema,
    selectFilterSchema,
    textFilterSchema,
  ],
};

// ---------------------------------------------------------------------------
// Sort rule sub-schema
// ---------------------------------------------------------------------------

const sortRuleSchema = {
  type: 'object',
  required: ['columnKey', 'direction'],
  properties: {
    columnKey: {
      type: 'string',
      enum: [...ENTERPRISE_ORDER_ALLOWED_COLUMNS],
    },
    direction: { type: 'string', enum: ['asc', 'desc'] },
  },
  additionalProperties: false,
};

// ---------------------------------------------------------------------------
// Route querystring schemas
// ---------------------------------------------------------------------------

/**
 * TypeScript type for the /paginated querystring.
 */
export type PaginatedEnterpriseOrdersQuery = {
  readonly filter: EnterpriseOrdersFilters;
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly SortRule[];
};

/**
 * JSON Schema for the /paginated querystring.
 */
export const paginatedEnterpriseOrdersQuerySchema = {
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      default: {},
      propertyNames: { enum: [...ENTERPRISE_ORDER_ALLOWED_COLUMNS] },
      additionalProperties: filterValueSchema,
    },
    limit: { type: 'integer', default: DEFAULT_PAGE_LIMIT, minimum: 1 },
    skip: { type: 'integer', default: 0, minimum: 0 },
    sort: {
      type: 'array',
      default: [],
      items: sortRuleSchema,
    },
  },
};

/**
 * TypeScript type for the /distinct/:columnName querystring.
 */
export type DistinctValuesQuery = {
  readonly limit: number;
  readonly offset: number;
};

/**
 * JSON Schema for the /distinct/:columnName querystring.
 */
export const distinctValuesQuerySchema = {
  type: 'object',
  properties: {
    limit: { type: 'integer', default: DISTINCT_DEFAULT_LIMIT, minimum: 1 },
    offset: { type: 'integer', default: 0, minimum: 0 },
  },
};

/**
 * TypeScript type for the /distinct/:columnName params.
 */
export type DistinctColumnParams = {
  readonly columnName: string;
};

/**
 * JSON Schema for the /distinct/:columnName params.
 */
export const distinctColumnParamsSchema = {
  type: 'object',
  required: ['columnName'],
  properties: {
    columnName: {
      type: 'string',
      enum: [...ENTERPRISE_ORDER_DISTINCT_COLUMNS],
    },
  },
};

/**
 * TypeScript type for the /:orderId params.
 */
export type OrderByIdParams = {
  readonly orderId: string;
};

/**
 * JSON Schema for the /:orderId params.
 */
export const orderByIdParamsSchema = {
  type: 'object',
  required: ['orderId'],
  properties: {
    orderId: { type: 'string', pattern: String.raw`^\d+$` },
  },
};
