import { DEFAULT_MAX_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';

import { resolveColumnMinWidth } from './resolveColumnMinWidth.util';

type ResolveColumnWidthBoundsArgs = {
  readonly maxWidth?: number;
  readonly minWidth?: number;
};

export const resolveColumnWidthBounds = ({
  maxWidth,
  minWidth,
}: ResolveColumnWidthBoundsArgs) => ({
  maxWidth: maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH,
  minWidth: resolveColumnMinWidth({ maxWidth, minWidth }),
});
