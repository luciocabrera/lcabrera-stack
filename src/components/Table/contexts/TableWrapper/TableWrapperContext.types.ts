import type { RefObject } from 'react';

export type TableWrapperContextValue = {
  readonly wrapperRef: RefObject<HTMLDivElement | null>;
};
