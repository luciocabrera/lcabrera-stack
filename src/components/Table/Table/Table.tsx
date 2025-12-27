import * as stylex from '@stylexjs/stylex';

import type { TableProps } from './Table.types';

import { tableStyles } from './Table.stylex';

export function Table(props: TableProps) {
  const {
    children,
    customStylex,
    density = 'comfortable',
    isBordered = true,
    isStriped = false,
    ...rest
  } = props;
  // Only set data-striped if boolean
  const dataStriped = typeof isStriped === 'boolean' ? { 'data-striped': String(isStriped) } : {};
  return (
    <table
      data-testid="table"
      {...dataStriped}
      {...rest}
      {...stylex.props(
        tableStyles.base,
        density === 'compact' ? tableStyles.density.compact : tableStyles.density.comfortable,
        !isBordered && tableStyles.variants.borderless,
        customStylex,
      )}
    >
      {children}
    </table>
  );
}
