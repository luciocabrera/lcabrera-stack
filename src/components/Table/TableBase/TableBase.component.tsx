import * as stylex from '@stylexjs/stylex';

import type { TableBaseProps } from './TableBase.types';

import { tableStyles } from './TableBase.stylex';

export const TableBase = <TData extends Record<string, unknown>>(
  props: TableBaseProps<TData>,
) => {
  const {
    children,
    customStylex,
    density = 'comfortable',
    isBordered = true,
    isStriped = false,
    ...rest
  } = props;

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
