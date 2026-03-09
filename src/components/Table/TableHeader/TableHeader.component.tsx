import * as stylex from '@stylexjs/stylex';

import { useGetEffectiveColumns } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { useRenderTracker } from '@/utils/performance';

import type { TableHeaderProps } from './TableHeader.types';

import { TableHeaderCell } from '../TableHeaderCell';
import { TableRow } from '../TableRow';
import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = <TData extends Record<string, unknown>, TResponse>({
  customStylex,
  ...rest
}: TableHeaderProps<TData, TResponse>) => {
  useRenderTracker({ componentName: 'TableHeader' });

  const effectiveColumns = useGetEffectiveColumns();

  return (
    <thead
      data-testid='table-header'
      {...rest}
      {...stylex.props(tableHeaderStyles.container, customStylex)}
    >
      <TableRow isHeader>
        {effectiveColumns.map((col) => (
          <TableHeaderCell columnKey={col.key} hasSettings key={col.key} />
        ))}
      </TableRow>
    </thead>
  );
};
