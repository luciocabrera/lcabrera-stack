import { inferTableColumnsFromJson } from '#ui/components/Table/utils/inferTableColumnsFromJson.util';

import type { StaticTableProps } from './StaticTable.types';

import { StaticTableGrid } from './StaticTableGrid/StaticTableGrid.component';

export const StaticTable = <TData extends Record<string, unknown>>({
  actions,
  columns,
  rows,
  title,
}: StaticTableProps<TData>) =>
  columns ? (
    <StaticTableGrid<TData>
      actions={actions}
      columns={columns}
      rows={rows}
      title={title}
    />
  ) : (
    <StaticTableGrid<Record<string, unknown>>
      actions={actions}
      columns={inferTableColumnsFromJson({ rows })}
      rows={rows}
      title={title}
    />
  );
