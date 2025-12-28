import type { ComponentPropsWithoutRef } from 'react';

import type { CustomStylex } from '@/design-system/common.types';

import type { TableColumnDataType } from '../Table.types';

export type TableBodyCellProps = ComponentPropsWithoutRef<'td'> & {
  columnLabel?: string;
  customStylex?: CustomStylex;
  dataType?: TableColumnDataType;
  minWidth?: number | string;
  value: unknown;
  width?: number | string;
};
