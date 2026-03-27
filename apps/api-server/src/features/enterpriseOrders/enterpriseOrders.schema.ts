import { z } from "zod";

import { HttpError } from "../../errors/httpError";
import type { SortRule } from "../../types/api.types";
import { parseJsonQueryParam } from "../../utils/parseJsonQueryParam.util";

import type { EnterpriseOrdersFilter, EnterpriseOrdersFilters } from "./enterpriseOrders.types";

const sortRuleSchema = z.object({
  columnKey: z.string().min(1),
  direction: z.enum(["asc", "desc"]),
});

const booleanFilterSchema = z.object({
  type: z.literal("boolean"),
  value: z.boolean(),
});

const dateFilterSchema = z.object({
  operator: z.enum(["after", "before", "between", "equals"]),
  type: z.literal("date"),
  value: z.string().min(1),
  value2: z.string().min(1).optional(),
});

const numberFilterSchema = z.object({
  operator: z.enum([
    "between",
    "equals",
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
    "notEquals",
  ]),
  type: z.literal("number"),
  value: z.coerce.number(),
  value2: z.coerce.number().optional(),
});

const selectFilterSchema = z.object({
  operator: z.enum(["equals", "notEquals"]).optional(),
  type: z.enum(["multiSelect", "select"]),
  value: z.string().min(1).optional(),
  values: z.array(z.string().min(1)).optional(),
});

const textFilterSchema = z.object({
  operator: z.enum(["contains", "endsWith", "equals", "notContains", "notEquals", "startsWith"]),
  type: z.literal("text"),
  value: z.string().min(1),
});

const filterSchema = z.discriminatedUnion("type", [
  booleanFilterSchema,
  dateFilterSchema,
  numberFilterSchema,
  selectFilterSchema,
  textFilterSchema,
]);

type ParseDistinctColumnArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: string;
};

type ParseFiltersArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

type ParseSortingArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

/**
 * Validate the requested distinct column.
 */
export const parseDistinctColumnName = ({
  allowedColumns,
  value,
}: ParseDistinctColumnArgs): string => {
  if (!allowedColumns.has(value)) {
    throw new HttpError({
      message: `Unsupported distinct column: ${value}`,
      statusCode: 400,
    });
  }

  return value;
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
      message: "Invalid enterprise order filter parameter.",
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
  const parsedValue = parseJsonQueryParam(value);

  if (parsedValue === undefined) {
    return [];
  }

  const result = z.array(sortRuleSchema).safeParse(parsedValue);

  if (!result.success) {
    throw new HttpError({
      message: "Invalid enterprise order sorting parameter.",
      statusCode: 400,
    });
  }

  for (const sortRule of result.data) {
    if (!allowedColumns.has(sortRule.columnKey)) {
      throw new HttpError({
        message: `Unsupported enterprise order sort column: ${sortRule.columnKey}`,
        statusCode: 400,
      });
    }
  }

  return result.data;
};
