import type { ReactNode, RefObject } from 'react';

export type TableWrapperContextValue = {
  readonly wrapperRef: RefObject<HTMLDivElement | null>;
};

export type TableWrapperProviderProps = {
  readonly children: ReactNode;
};
