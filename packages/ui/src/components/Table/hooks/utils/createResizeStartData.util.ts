import { resolveColumnWidthBounds } from '#ui/components/Table/utils';

type CreateResizeStartDataArgs = {
  readonly clientX: number;
  readonly currentWidth?: number;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

export const createResizeStartData = ({
  clientX,
  currentWidth,
  maxWidth,
  minWidth,
}: CreateResizeStartDataArgs) => {
  const bounds = resolveColumnWidthBounds({ maxWidth, minWidth });

  return {
    initialWidth: currentWidth ?? bounds.minWidth,
    initialX: clientX,
    maxWidth: bounds.maxWidth,
    minWidth: bounds.minWidth,
  };
};
