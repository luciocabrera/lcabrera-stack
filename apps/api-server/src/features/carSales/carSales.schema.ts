import { z } from "zod";

import { HttpError } from "../../errors/httpError";
import type { SortRule } from "../../types/api.types";
import { parseJsonQueryParam } from "../../utils/parseJsonQueryParam.util";

const sortRuleSchema = z.object({
  columnKey: z.string().min(1),
  direction: z.enum(["asc", "desc"]),
});

type ParseSortingArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly value: unknown;
};

/**
 * Parse and validate car-sales sorting.
 */
export const parseCarSalesSorting = ({
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
      message: "Invalid car sales sorting parameter.",
      statusCode: 400,
    });
  }

  for (const sortRule of result.data) {
    if (!allowedColumns.has(sortRule.columnKey)) {
      throw new HttpError({
        message: `Unsupported car sales sort column: ${sortRule.columnKey}`,
        statusCode: 400,
      });
    }
  }

  return result.data;
};
