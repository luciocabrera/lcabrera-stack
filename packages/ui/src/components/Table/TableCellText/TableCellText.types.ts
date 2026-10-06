import type { ReactNode } from 'react';

export type TableCellTextParams = {
  readonly monospace: boolean;
  readonly weight: TableCellTextWeight;
};

export type TableCellTextProps = {
  readonly children: ReactNode;
  readonly isMonospace?: boolean;
  readonly weight?: TableCellTextWeight;
};

export type TableCellTextWeight = 'bold' | 'regular';
