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
  useGetTableIsBordered,
  useGetTableIsStriped,
} from '../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableTotalRows,
} from '../contexts/TableData/data/selectors';
import { tableStyles } from './TableBase.stylex';

/**
 * The grid element.
 *
 * `role="grid"` is declared rather than inherited, and so are the roles on
 * every row, cell and column header below it: this table's `<tbody>` is
 * `display: grid` and its rows and cells are `display: flex`, and a browser
 * drops an element's implicit table role along with its table `display`. The
 * roles are therefore the only source of the grid's semantics, not a
 * belt-and-braces duplicate of native ones (ADR-062). Anyone restoring native
 * `display` values here must remove them in the same change.
 *
 * It becomes a `treegrid` when the loaded rows are a tree — asked of the rows,
 * the same way `TableBodyRows` asks a row which component it gets, so a grouped
 * read that returned no groups is not announced as a tree with nothing in it
 * (ADR-067). The row count changes with the role: a tree's rows are the ones a
 * collapse leaves standing, so `aria-rowcount` counts those rather than the
 * dataset, and the body's `aria-rowindex` sequence — derived from the same
 * array — still ends exactly on it.
 */
export const TableBase = <TData extends Record<string, unknown>, TResponse>({
  children,
  customStylex,
  ...rest
}: TableBaseProps<TData, TResponse>) => {
  const density = useGetTableDensity();
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
        density === 'compact'
          ? tableStyles.density.compact
          : tableStyles.density.comfortable,
        !isBordered && tableStyles.variants.borderless,
        customStylex,
      )}
    >
      {children}
    </table>
  );
};
