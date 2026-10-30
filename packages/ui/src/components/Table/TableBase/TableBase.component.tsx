import * as stylex from '@stylexjs/stylex';

import {
  useSyncTableGroupExpansion,
  useTableGridFocus,
  useTableGroupTree,
} from '#ui/components/Table/hooks';
import { resolveAriaRowCount } from '#ui/components/Table/utils/resolveGridRowIndexing.util';

import type { TableBaseProps } from './TableBase.types';

import {
  useGetTableDensity,
  useGetTableHeaderDensity,
  useGetTableIsBordered,
  useGetTableIsStriped,
} from '../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableTotalRows,
} from '../contexts/TableData/data/selectors';
import { TABLE_DENSITY_SCALE } from '../Table.constants';
import { tableStyles } from './TableBase.stylex';

export const TableBase = <TData extends Record<string, unknown>, TResponse>({
  children,
  customStylex,
  ...rest
}: TableBaseProps<TData, TResponse>) => {
  const body = TABLE_DENSITY_SCALE[useGetTableDensity()];
  const header = TABLE_DENSITY_SCALE[useGetTableHeaderDensity()];
  const isBordered = useGetTableIsBordered();
  const isStriped = useGetTableIsStriped();
  const totalRows = useGetTableTotalRows();
  const isLoading = useGetTableIsLoading();
  const gridFocusProps = useTableGridFocus<TData>();
  const { isTreeGrid, rows } = useTableGroupTree<TData>();

  useSyncTableGroupExpansion<TData>();

  return (
    <table
      data-striped={isStriped}
      data-testid='table'
      {...rest}
      aria-rowcount={resolveAriaRowCount({
        isLoading,
        totalRows: isTreeGrid ? rows.length : totalRows,
      })}
      role={isTreeGrid ? 'treegrid' : 'grid'}
      {...gridFocusProps}
      {...stylex.props(
        tableStyles.base,
        tableStyles.density({ body, header }),
        !isBordered && tableStyles.variants.borderless,
        customStylex,
      )}
    >
      {children}
    </table>
  );
};
