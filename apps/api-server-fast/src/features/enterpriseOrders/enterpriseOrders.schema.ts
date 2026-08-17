import type { SortRule } from 'api-shared';

import {
  DEFAULT_PAGE_LIMIT,
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  MAX_ENTERPRISE_ORDERS_LIMIT,
} from 'api-shared';

import type { EnterpriseOrdersFilters } from './enterpriseOrders.types';

/**
 * The closed vocabularies — `type` and `operator` — are validated strictly, and
 * the values are not.
 *
 * A filter arrives from a table the user is still editing, so its value may not
 * exist yet: a number input mid-keystroke sends no `value` at all, a cleared
 * text box sends an empty string. `@lcabrera/server`'s mappers define those as
 * drafting states and emit no SQL clause for them, so requiring a value here
 * rejected requests the React Router route serves (#567). Every state the
 * shared `ColumnFilter` contract admits is accepted; what becomes SQL is
 * `toQueryFilters`'s call, not this schema's.
 * `ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` is the guard.
 */
const filterValueSchema = {
  additionalProperties: false,
  allOf: [
    {
      if: {
        properties: {
          type: { const: 'boolean' },
        },
        required: ['type'],
      },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema uses then/if conditionals
      then: {
        properties: {
          value: { type: 'boolean' },
        },
        required: ['type', 'value'],
      },
    },
    {
      if: {
        properties: {
          type: { const: 'date' },
        },
        required: ['type'],
      },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema uses then/if conditionals
      then: {
        properties: {
          operator: {
            enum: ['after', 'before', 'between', 'equals'],
            type: 'string',
          },
          value: { type: 'string' },
          value2: { type: 'string' },
        },
        required: ['type', 'operator', 'value'],
      },
    },
    {
      if: {
        properties: {
          type: { const: 'number' },
        },
        required: ['type'],
      },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema uses then/if conditionals
      then: {
        properties: {
          operator: {
            enum: [
              'between',
              'equals',
              'greaterThan',
              'greaterThanOrEqual',
              'lessThan',
              'lessThanOrEqual',
              'notEquals',
            ],
            type: 'string',
          },
          value: { type: 'number' },
          value2: { type: 'number' },
        },
        required: ['type', 'operator'],
      },
    },
    {
      if: {
        properties: {
          type: { enum: ['multiSelect', 'select'] },
        },
        required: ['type'],
      },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema uses then/if conditionals
      then: {
        properties: {
          operator: { enum: ['equals', 'notEquals'], type: 'string' },
          value: { type: 'string' },
          values: {
            items: { type: 'string' },
            type: 'array',
          },
        },
      },
    },
    {
      if: {
        properties: {
          type: { const: 'text' },
        },
        required: ['type'],
      },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema uses then/if conditionals
      then: {
        properties: {
          operator: {
            enum: [
              'contains',
              'endsWith',
              'equals',
              'notContains',
              'notEquals',
              'startsWith',
            ],
            type: 'string',
          },
          value: { type: 'string' },
        },
        required: ['type', 'operator', 'value'],
      },
    },
  ],
  properties: {
    operator: { type: 'string' },
    type: {
      enum: ['boolean', 'date', 'multiSelect', 'number', 'select', 'text'],
      type: 'string',
    },
    value: {},
    value2: {},
    values: {
      items: { type: 'string' },
      type: 'array',
    },
  },
  required: ['type'],
  type: 'object',
};

// ---------------------------------------------------------------------------
// Sort rule sub-schema
// ---------------------------------------------------------------------------

const sortRuleSchema = {
  additionalProperties: false,
  properties: {
    columnKey: {
      enum: [...ENTERPRISE_ORDER_ALLOWED_COLUMNS],
      type: 'string',
    },
    direction: { enum: ['asc', 'desc'], type: 'string' },
  },
  required: ['columnKey', 'direction'],
  type: 'object',
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
  properties: {
    filter: {
      additionalProperties: filterValueSchema,
      default: {},
      propertyNames: { enum: [...ENTERPRISE_ORDER_ALLOWED_COLUMNS] },
      type: 'object',
    },
    limit: {
      default: DEFAULT_PAGE_LIMIT,
      maximum: MAX_ENTERPRISE_ORDERS_LIMIT,
      minimum: 1,
      type: 'integer',
    },
    skip: { default: 0, minimum: 0, type: 'integer' },
    sort: {
      default: [],
      items: sortRuleSchema,
      type: 'array',
    },
  },
  type: 'object',
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
  properties: {
    orderId: { pattern: String.raw`^\d+$`, type: 'string' },
  },
  required: ['orderId'],
  type: 'object',
};
