import type { RefObject } from 'react';

export type VirtualListBodyChildrenProps = {
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
};
