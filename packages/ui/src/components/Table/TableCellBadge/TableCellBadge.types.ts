import type { ReactNode } from 'react';

import type { TableCellToneColors } from '#ui/components/Table/Table.types';

export type TableCellBadgeParams = {
  readonly fallbackTone: string;
  readonly rules: readonly TableCellBadgeRule[];
};

export type TableCellBadgeProps = {
  readonly children: ReactNode;
  readonly tone: TableCellToneColors;
};

export type TableCellBadgeRule = {
  readonly equals?: boolean | number | string;
  readonly gte?: number;
  readonly lt?: number;
  readonly tone: string;
};
