import type { VirtualizedTableHeaderProps } from './VirtualizedTableHeader.types';

import { TableCell, TableHeader, TableRow } from '../../../Table';

export function VirtualizedTableHeader({ columns }: VirtualizedTableHeaderProps) {
  return (
    <TableHeader isSticky>
      <TableRow isHeader>
        {columns.map((col) => (
          <TableCell isHeader isSticky key={col.key} minWidth={col.minWidth ?? 120}>
            {col.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHeader>
  );
}
