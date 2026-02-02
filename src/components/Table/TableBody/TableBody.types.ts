import type { ComponentPropsWithRef, RefObject } from 'react';

export type TableBodyProps = ComponentPropsWithRef<'tbody'> & {
  tableContainerRef: RefObject<HTMLDivElement | null>;
};
