import type { StandardSchemaV1Result } from '#ui/components/Table/Table.types';

import { isTableCellToneName } from '#ui/components/Table/cellRenderers/isTableCellToneName.util';
import { readTableCellParams } from '#ui/components/Table/cellRenderers/readTableCellParams.util';

import type { TableCellDeltaParams } from '../TableCellDelta.types';

import { isTableCellDeltaPrecision } from './isTableCellDeltaPrecision.util';

const PARAM_ISSUES = {
  decrease: 'decrease must be a tone name',
  increase: 'increase must be a tone name',
  precision: 'precision must be an integer from 0 to 20',
  unchanged: 'unchanged must be a tone name',
} as const;

const PARAM_KEYS = new Set(Object.keys(PARAM_ISSUES));

export const parseTableCellDeltaParams = (
  value: unknown,
): StandardSchemaV1Result<TableCellDeltaParams> => {
  const read = readTableCellParams({ allowed: PARAM_KEYS, value });

  if ('issues' in read) return read;

  const {
    decrease = 'error',
    increase = 'success',
    precision,
    unchanged = 'neutral',
  } = read.record;

  if (!isTableCellToneName(decrease)) {
    return { issues: [{ message: PARAM_ISSUES.decrease, path: ['decrease'] }] };
  }
  if (!isTableCellToneName(increase)) {
    return { issues: [{ message: PARAM_ISSUES.increase, path: ['increase'] }] };
  }
  if (!isTableCellToneName(unchanged)) {
    return {
      issues: [{ message: PARAM_ISSUES.unchanged, path: ['unchanged'] }],
    };
  }
  if (precision !== undefined && !isTableCellDeltaPrecision(precision)) {
    return {
      issues: [{ message: PARAM_ISSUES.precision, path: ['precision'] }],
    };
  }

  return {
    value: {
      decrease,
      increase,
      unchanged,
      ...(precision !== undefined && { precision }),
    },
  };
};
