import type { TableCellRenderer } from '#ui/components/Table/Table.types';

import { createTableCellParamsSchema } from '#ui/components/Table/cellRenderers/createTableCellParamsSchema.util';
import { TableCellBadge } from '#ui/components/Table/TableCellBadge/TableCellBadge.component';
import { TableCellText } from '#ui/components/Table/TableCellText/TableCellText.component';

import type {
  TableCellDeltaDirection,
  TableCellDeltaParams,
} from './TableCellDelta.types';

import { parseTableCellDeltaParams } from './utils/parseTableCellDeltaParams.util';
import { resolveTableCellDelta } from './utils/resolveTableCellDelta.util';

const TABLE_CELL_DELTA_GLYPHS: Readonly<
  Record<TableCellDeltaDirection, string>
> = {
  decrease: '▼ ',
  increase: '▲ ',
  unchanged: '±',
};

export const TABLE_CELL_DELTA_RENDERER: TableCellRenderer<TableCellDeltaParams> =
  {
    kind: 'delta',
    params: createTableCellParamsSchema(parseTableCellDeltaParams),
    render: ({ formatted, params, tone, value }) => {
      const delta = resolveTableCellDelta({
        precision: params.precision,
        value,
      });

      if (delta === undefined) {
        return <TableCellText>{formatted}</TableCellText>;
      }

      return (
        <TableCellBadge tone={tone(params[delta.direction])}>
          {`${TABLE_CELL_DELTA_GLYPHS[delta.direction]}${delta.magnitude}`}
        </TableCellBadge>
      );
    },
  };
