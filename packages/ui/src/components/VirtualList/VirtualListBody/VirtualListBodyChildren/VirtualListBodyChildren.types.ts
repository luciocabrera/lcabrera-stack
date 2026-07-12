import type { RefObject } from 'react';

export type VirtualListBodyChildrenProps = {
  /** Scroll container owned by VirtualListBody (window + height measurement) */
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
};
