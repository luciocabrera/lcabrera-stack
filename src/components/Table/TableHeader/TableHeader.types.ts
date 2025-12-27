import type { ComponentPropsWithoutRef } from 'react';

import type { TableCustomStylex } from '../Table/Table.types';

export type TableHeaderProps = ComponentPropsWithoutRef<'div'> & {
  customStylex?: TableCustomStylex;
  isSticky?: boolean;
};
