import type { StandardSchemaV1 } from '#ui/components/Table/Table.types';

import type { TableCellParamsParser } from './cellRenderers.types';

export const createTableCellParamsSchema = <TParams>(
  parse: TableCellParamsParser<TParams>,
): StandardSchemaV1<TParams> => ({
  '~standard': {
    validate: parse,
    vendor: '@lcabrera/ui',
    version: 1,
  },
});
