import type { ComponentPropsWithRef, RefObject } from 'react';

export type TableBodyProps = ComponentPropsWithRef<'tbody'> & {
  /** Number of placeholder rows to show when loading with no data */
  // placeholderRowCount?: number;
  tableContainerRef: RefObject<HTMLDivElement | null>;
};
