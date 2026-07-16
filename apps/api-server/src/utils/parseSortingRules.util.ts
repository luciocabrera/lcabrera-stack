import type { SortRule } from 'api-shared';

import { HttpError } from 'api-shared';
import { z } from 'zod';

import { parseJsonQueryParam } from './parseJsonQueryParam.util';

const sortRuleSchema = z.object({
  columnKey: z.string().min(1),
  direction: z.enum(['asc', 'desc']),
});

type ParseSortingRulesArgs = {
  readonly allowedColumns: ReadonlySet<string>;
  readonly invalidSortMessage: string;
  readonly unsupportedSortColumnMessage: (columnKey: string) => string;
  readonly value: unknown;
};

/**
 * Parse and validate sorting rules from a query parameter.
 */
export const parseSortingRules = ({
  allowedColumns,
  invalidSortMessage,
  unsupportedSortColumnMessage,
  value,
}: ParseSortingRulesArgs): readonly SortRule[] => {
  const parsedValue = parseJsonQueryParam(value);

  if (parsedValue === undefined) {
    return [];
  }

  const result = z.array(sortRuleSchema).safeParse(parsedValue);

  if (!result.success) {
    throw new HttpError({
      message: invalidSortMessage,
      statusCode: 400,
    });
  }

  for (const sortRule of result.data) {
    if (!allowedColumns.has(sortRule.columnKey)) {
      throw new HttpError({
        message: unsupportedSortColumnMessage(sortRule.columnKey),
        statusCode: 400,
      });
    }
  }

  return result.data;
};
