import {
  DEFAULT_MAX_COLUMN_WIDTH,
  DEFAULT_MIN_COLUMN_WIDTH,
} from '#ui/components/Table/Table.constants';

type ResolveColumnWidthBoundsArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

export const resolveColumnWidthBounds = ({
  maxWidth,
  minWidth,
}: ResolveColumnWidthBoundsArgs) => ({
  maxWidth: maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
  minWidth: minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
});
