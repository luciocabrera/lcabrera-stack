import type { TableColumn } from '../Table.types';

import { resolveColumnMinWidth } from './resolveColumnMinWidth.util';
import { resolveColumnStartWidth } from './resolveColumnStartWidth.util';

type ResolveStaticColumnWidthsArgs<TData> = Pick<
  TableColumn<TData>,
  'maxWidth' | 'minWidth' | 'width'
> & {
  readonly isPinned?: boolean;
  readonly sizedWidth?: number;
};

export const resolveStaticColumnWidths = <TData>({
  isPinned = false,
  maxWidth,
  minWidth,
  sizedWidth,
  width,
}: ResolveStaticColumnWidthsArgs<TData>) => {
  if (isPinned) {
    const pinnedWidth =
      sizedWidth ?? resolveColumnStartWidth({ maxWidth, minWidth, width });

    return { maxWidth: pinnedWidth, minWidth: pinnedWidth, width: pinnedWidth };
  }

  return {
    maxWidth,
    minWidth: resolveColumnMinWidth({ maxWidth, minWidth }),
    width: sizedWidth ?? (width === 'fill' ? '100%' : width),
  };
};

export type TableStaticColumnWidths = ReturnType<
  typeof resolveStaticColumnWidths
>;
