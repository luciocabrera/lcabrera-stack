import * as stylex from '@stylexjs/stylex';
import { use } from 'react';

import {
  useSyncTableGroupExpansion,
  useTableGridFocus,
  useTableGroupTree,
} from '#ui/components/Table/hooks';
import { resolveTableSemantics } from '#ui/components/Table/utils/resolveTableSemantics.util';

import type { TableBaseProps } from './TableBase.types';

import {
  useGetTableDensity,
  useGetTableHeaderDensity,
  useGetTableIsBordered,
  useGetTableIsStriped,
} from '../contexts/TableConfig/meta/selectors';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';
import {
  useGetTableIsLoading,
  useGetTableTotalRows,
} from '../contexts/TableData/data/selectors';
import { TABLE_DENSITY_SCALE } from '../Table.constants';
import { TableFooter } from '../TableFooter/TableFooter.component';
import { tableStyles } from './TableBase.stylex';

export const TableBase = <TData extends Record<string, unknown>, TResponse>({
  caption,
  children,
  customStylex,
  footer,
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
  const { layout } = use(TablePresentationContext);

  useSyncTableGroupExpansion<TData>();

  return (
    <table
      data-striped={isStriped}
      data-testid='table'
      {...rest}
      {...resolveTableSemantics({
        gridFocusProps,
        isLoading,
        isTreeGrid,
        layout,
        totalRows: isTreeGrid ? rows.length : totalRows,
      })}
      {...stylex.props(
        tableStyles.base,
        tableStyles.density({ body, header }),
        !isBordered && tableStyles.variants.borderless,
        customStylex,
      )}
    >
      {caption !== undefined && (
        <caption {...stylex.props(tableStyles.caption)}>{caption}</caption>
      )}
      {children}
      {footer !== undefined && <TableFooter>{footer}</TableFooter>}
    </table>
  );
};
