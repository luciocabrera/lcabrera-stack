type ResolveResizeWidthArgs = {
  readonly clientX: number;
  readonly initialWidth: number;
  readonly initialX: number;
  readonly maxWidth: number;
  readonly minWidth: number;
};

export const resolveResizeWidth = ({
  clientX,
  initialWidth,
  initialX,
  maxWidth,
  minWidth,
}: ResolveResizeWidthArgs) =>
  Math.max(minWidth, Math.min(maxWidth, initialWidth + (clientX - initialX)));
