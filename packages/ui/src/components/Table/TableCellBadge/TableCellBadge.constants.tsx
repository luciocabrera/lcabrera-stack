import type { TableCellRenderer } from '#ui/components/Table/Table.types';

import { createTableCellParamsSchema } from '#ui/components/Table/cellRenderers/createTableCellParamsSchema.util';
import { isEmptyCellValue } from '#ui/components/Table/cellRenderers/isEmptyCellValue.util';

import type { TableCellBadgeParams } from './TableCellBadge.types';

import { TableCellBadge } from './TableCellBadge.component';
import { parseTableCellBadgeParams } from './utils/parseTableCellBadgeParams.util';
import { selectTableCellBadgeTone } from './utils/selectTableCellBadgeTone.util';

export const TABLE_CELL_BADGE_RENDERER: TableCellRenderer<TableCellBadgeParams> =
  {
    kind: 'badge',
    params: createTableCellParamsSchema(parseTableCellBadgeParams),
    render: ({ formatted, params, tone, value }) =>
      isEmptyCellValue(value) ? undefined : (
        <TableCellBadge
          tone={tone(selectTableCellBadgeTone({ params, value }))}
        >
          {formatted}
        </TableCellBadge>
      ),
  };
