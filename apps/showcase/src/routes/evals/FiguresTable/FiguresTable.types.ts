import type { ReactNode } from 'react';

export type FiguresColumn = {
  readonly isNumeric?: boolean;
  readonly key: string;
  readonly label: string;
};

export type FiguresRow = {
  readonly cells: Readonly<Record<string, ReactNode>>;
  readonly key: string;
};

export type FiguresTableProps = {
  readonly caption: string;
  readonly columns: readonly FiguresColumn[];
  readonly rows: readonly FiguresRow[];
};
