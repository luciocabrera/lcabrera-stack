type ResolveResizeWidthArgs = {
  readonly clientX: number;
  readonly initialWidth: number;
  readonly initialX: number;
  readonly maxWidth: number;
  readonly minWidth: number;
};

/**
 * Width of a dragged column: the pointer delta from the drag origin applied
 * to the starting width, clamped to the [minWidth, maxWidth] bounds.
 */
export const resolveResizeWidth = ({
  clientX,
  initialWidth,
  initialX,
  maxWidth,
  minWidth,
}: ResolveResizeWidthArgs) =>
  Math.max(minWidth, Math.min(maxWidth, initialWidth + (clientX - initialX)));
