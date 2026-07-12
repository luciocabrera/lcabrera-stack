import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '@repo/ui/components/Table/Table.constants';

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
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

  return {
    initialWidth: currentWidth ?? effectiveMinWidth,
    initialX: clientX,
    maxWidth: maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
    minWidth: effectiveMinWidth,
  };
};
