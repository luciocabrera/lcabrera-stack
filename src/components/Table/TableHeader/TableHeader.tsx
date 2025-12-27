import * as stylex from '@stylexjs/stylex';

import type { TableHeaderProps } from './TableHeader.types';

import { tableHeaderStyles } from './TableHeader.stylex';

export const TableHeader = ({ children, customStylex, isSticky = false, ...rest }: TableHeaderProps) => (
  <thead
    data-testid="table-header"
    {...rest}
    {...stylex.props(tableHeaderStyles.container, isSticky && tableHeaderStyles.sticky, customStylex)}
  >
    {children}
  </thead>
);
