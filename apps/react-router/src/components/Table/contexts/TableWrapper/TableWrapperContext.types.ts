import type { RefObject } from "react";

export type TableWrapperContextValue = {
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly wrapperRef: RefObject<HTMLDivElement | null>;
};
