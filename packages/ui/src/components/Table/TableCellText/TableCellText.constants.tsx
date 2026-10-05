import type { TableCellRenderer } from '#ui/components/Table/Table.types';

import { createTableCellParamsSchema } from '#ui/components/Table/cellRenderers/createTableCellParamsSchema.util';

import type { TableCellTextParams } from './TableCellText.types';

import { TableCellText } from './TableCellText.component';
import { parseTableCellTextParams } from './utils/parseTableCellTextParams.util';

export const TABLE_CELL_TEXT_RENDERER: TableCellRenderer<TableCellTextParams> =
  {
    kind: 'text',
    params: createTableCellParamsSchema(parseTableCellTextParams),
    render: ({ formatted, params }) => (
      <TableCellText isMonospace={params.monospace} weight={params.weight}>
        {formatted}
      </TableCellText>
    ),
  };
