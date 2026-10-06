import type { StandardSchemaV1Issue } from '#ui/components/Table/Table.types';

import { isTableCellParamsRecord } from './isTableCellParamsRecord.util';
import { listUnknownKeys } from './listUnknownKeys.util';

type ReadTableCellParamsArgs = {
  readonly allowed: ReadonlySet<string>;
  readonly value: unknown;
};

type ReadTableCellParamsResult =
  | { readonly issues: readonly StandardSchemaV1Issue[] }
  | { readonly record: Readonly<Record<string, unknown>> };

export const readTableCellParams = ({
  allowed,
  value,
}: ReadTableCellParamsArgs): ReadTableCellParamsResult => {
  if (!isTableCellParamsRecord(value)) {
    return { issues: [{ message: 'params must be an object' }] };
  }

  const [unknownKey] = listUnknownKeys({ allowed, record: value });

  if (unknownKey !== undefined) {
    return {
      issues: [{ message: `unknown param "${unknownKey}"` }],
    };
  }

  return { record: value };
};
