import type { SortRule } from 'api-shared';

import { HttpError } from 'api-shared';
import { z } from 'zod';

import type {
  EnterpriseOrdersFilter,
  EnterpriseOrdersFilters,
} from './enterpriseOrders.types';

import { parseJsonQueryParam } from '../../utils/parseJsonQueryParam.util';
import { parseSortingRules } from '../../utils/parseSortingRules.util';

/**
 * The closed vocabularies — `type` and `operator` — are validated strictly, and
 * the values are not.
 *
 * A filter arrives from a table the user is still editing, so its value may not
 * exist yet: a number input mid-keystroke has no number, a cleared text box has
 * an empty string. `@lcabrera/server`'s mappers define those as drafting states
 * and emit no SQL clause for them, so requiring a value here rejected requests
 * the React Router route serves (#567). Every state the shared `ColumnFilter`
 * contract admits is accepted; what becomes SQL is `toQueryFilters`'s call, not
 * this schema's. `ENTERPRISE_ORDER_FILTER_CONTRACT_CASES` is the guard.
 */
const booleanFilterSchema = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
});

const dateFilterSchema = z.object({
  operator: z.enum(['after', 'before', 'between', 'equals']),
  type: z.literal('date'),
  value: z.string(),
  value2: z.string().optional(),
});

const numberFilterSchema = z.object({
  operator: z.enum([
    'between',
    'equals',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
    'notEquals',
  ]),
  type: z.literal('number'),
  value: z.coerce.number().optional(),
  value2: z.coerce.number().optional(),
});

const selectFilterSchema = z.object({
  operator: z.enum(['equals', 'notEquals']).optional(),
  type: z.enum(['multiSelect', 'select']),
  value: z.string().optional(),
  values: z.array(z.string()).optional(),
});

const textFilterSchema = z.object({
  operator: z.enum([
    'contains',
    'endsWith',
    'equals',
    'notContains',
    'notEquals',
    'startsWith',
  ]),
  type: z.literal('text'),
  value: z.string(),
});

/**
 * JSON cannot spell `value: undefined`, so a drafting number filter reaches us
 * with the key absent while the shared contract declares it present and
 * undefined. The transform restores it — the annotation is what checks that
 * the parsed result really is the contract's shape and not merely close to it.
 */
const filterSchema = z
  .discriminatedUnion('type', [
    booleanFilterSchema,
    dateFilterSchema,
    numberFilterSchema,
    selectFilterSchema,
    textFilterSchema,
  ])
  .transform(
    (filter): EnterpriseOrdersFilter =>
      filter.type === 'number' ? { ...filter, value: filter.value } : filter,
  );

type ParseFiltersArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

type ParseSortingArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

/**
 * Parse and validate enterprise-order filters.
 */
export const parseEnterpriseOrdersFilters = ({
  allowedColumns,
  value,
}: ParseFiltersArgs): EnterpriseOrdersFilters => {
  const parsedValue = parseJsonQueryParam(value);

  if (parsedValue === undefined) {
    return {};
  }

  const result = z.record(z.string(), filterSchema).safeParse(parsedValue);

  if (!result.success) {
    throw new HttpError({
      message: 'Invalid enterprise order filter parameter.',
      statusCode: 400,
    });
  }

  const filters: Record<string, EnterpriseOrdersFilter> = {};

  for (const [columnName, filterValue] of Object.entries(result.data)) {
    if (!allowedColumns.has(columnName)) {
      throw new HttpError({
        message: `Unsupported enterprise order filter column: ${columnName}`,
        statusCode: 400,
      });
    }

    filters[columnName] = filterValue;
  }

  return filters;
};

/**
 * Parse and validate enterprise-order sorting.
 */
export const parseEnterpriseOrdersSorting = ({
  allowedColumns,
  value,
}: ParseSortingArgs): readonly SortRule[] => {
  return parseSortingRules({
    allowedColumns,
    invalidSortMessage: 'Invalid enterprise order sorting parameter.',
    unsupportedSortColumnMessage: (columnKey) =>
      `Unsupported enterprise order sort column: ${columnKey}`,
    value,
  });
};
