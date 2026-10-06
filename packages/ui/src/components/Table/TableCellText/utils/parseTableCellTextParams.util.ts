import type { StandardSchemaV1Result } from '#ui/components/Table/Table.types';

import { readTableCellParams } from '#ui/components/Table/cellRenderers/readTableCellParams.util';

import type { TableCellTextParams } from '../TableCellText.types';

const PARAM_KEYS = new Set(['monospace', 'weight']);

export const parseTableCellTextParams = (
  value: unknown,
): StandardSchemaV1Result<TableCellTextParams> => {
  const read = readTableCellParams({ allowed: PARAM_KEYS, value });

  if ('issues' in read) return read;

  const { monospace = false, weight = 'regular' } = read.record;

  if (typeof monospace !== 'boolean') {
    return {
      issues: [{ message: 'monospace must be a boolean' }],
    };
  }
  if (weight !== 'bold' && weight !== 'regular') {
    return {
      issues: [{ message: 'weight must be "regular" or "bold"' }],
    };
  }

  return { value: { monospace, weight } };
};
