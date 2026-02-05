import * as stylex from '@stylexjs/stylex';

import type { TableBaseProps } from './TableBase.types';

import {
  useGetTableDensity,
  useGetTableIsBordered,
  useGetTableIsStriped,
} from '../TableContext/hooks/store/meta/selectors';
import { tableStyles } from './TableBase.stylex';

export const TableBase = <TData extends Record<string, unknown>, TResponse>({
  children,
  customStylex,
  ...rest
}: TableBaseProps<TData, TResponse>) => {
  const density = useGetTableDensity();
  const isBordered = useGetTableIsBordered();
  const isStriped = useGetTableIsStriped();

  return (
    <table
      data-striped={isStriped}
      data-testid='table'
      {...rest}
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
