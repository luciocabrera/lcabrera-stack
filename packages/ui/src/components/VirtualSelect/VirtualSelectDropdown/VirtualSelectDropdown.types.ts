/** The subset of a DOMRect the placement maths reads. */
export type AnchorRect = {
  readonly bottom: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
};

/** Viewport coordinates for a top-layer dropdown, in CSS pixels. */
export type DropdownPlacement = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
};
