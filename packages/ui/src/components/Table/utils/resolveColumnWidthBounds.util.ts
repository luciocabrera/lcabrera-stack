import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '#ui/components/Table/Table.constants';

type ResolveColumnWidthBoundsArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

/**
 * Effective clamping bounds for a column, resolving each unset side against
 * the table's default column widths. Every resize path (pointer drag, keyboard
 * stepping, the handle's announced `aria-valuemin`/`aria-valuemax`) reads its
 * bounds from here so they can never drift apart.
 */
export const resolveColumnWidthBounds = ({
  maxWidth,
  minWidth,
}: ResolveColumnWidthBoundsArgs) => ({
  maxWidth: maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
  minWidth: minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
});
