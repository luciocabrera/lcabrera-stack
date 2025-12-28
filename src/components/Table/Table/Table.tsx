import * as stylex from '@stylexjs/stylex';

import type { TableProps } from './Table.types';

import { tableStyles } from './Table.stylex';

export const Table = (props: TableProps) => {
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
