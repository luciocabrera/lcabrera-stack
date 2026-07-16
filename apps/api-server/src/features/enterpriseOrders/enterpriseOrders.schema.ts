import type { SortRule } from 'api-shared';

import { HttpError } from 'api-shared';
import { z } from 'zod';

import type {
  EnterpriseOrdersFilter,
  EnterpriseOrdersFilters,
} from './enterpriseOrders.types';

import { parseJsonQueryParam } from '../../utils/parseJsonQueryParam.util';
import { parseSortingRules } from '../../utils/parseSortingRules.util';

const booleanFilterSchema = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
});

const dateFilterSchema = z.object({
  operator: z.enum(['after', 'before', 'between', 'equals']),
  type: z.literal('date'),
  value: z.string().min(1),
  value2: z.string().min(1).optional(),
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
  value: z.coerce.number(),
  value2: z.coerce.number().optional(),
});

const selectFilterSchema = z.object({
  operator: z.enum(['equals', 'notEquals']).optional(),
  type: z.enum(['multiSelect', 'select']),
  value: z.string().min(1).optional(),
  values: z.array(z.string().min(1)).optional(),
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
  value: z.string().min(1),
});

const filterSchema = z.discriminatedUnion('type', [
  booleanFilterSchema,
  dateFilterSchema,
  numberFilterSchema,
  selectFilterSchema,
  textFilterSchema,
]);

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
