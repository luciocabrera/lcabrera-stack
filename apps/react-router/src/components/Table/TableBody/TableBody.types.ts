import type { ComponentPropsWithRef, RefObject } from 'react';

export type TableBodyProps = ComponentPropsWithRef<'tbody'> & {
  readonly tableContainerRef: RefObject<HTMLDivElement | null>;
};
