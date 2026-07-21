import { resolveColumnWidthBounds } from '@lcabrera/ui/components/Table/utils';

type CreateResizeStartDataArgs = {
  readonly clientX: number;
  readonly currentWidth?: number;
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/**
 * Snapshot the drag-start state for a column resize: the origin pointer
 * position, the effective starting width, and the clamping bounds resolved
 * against the table's default column widths.
 */
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
