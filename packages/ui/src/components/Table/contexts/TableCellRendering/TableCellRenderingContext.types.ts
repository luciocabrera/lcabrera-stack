import type { ReactNode } from 'react';

import type {
  TableCellPalette,
  TableCellRenderer,
} from '#ui/components/Table/Table.types';

export type TableCellRenderingContextValue = {
  readonly palettes: readonly (TableCellPalette | undefined)[];
  readonly renderers: readonly (readonly TableCellRenderer[])[];
  readonly warnOnce?: (message: string) => void;
};

export type TableCellRenderingProviderProps = {
  readonly cellPalettes?: readonly (TableCellPalette | undefined)[];
  readonly cellRenderers?: readonly TableCellRenderer[];
  readonly children: ReactNode;
};
