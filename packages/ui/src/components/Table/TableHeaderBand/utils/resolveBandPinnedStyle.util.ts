import type { PinnedColumnInfo } from '#ui/components/Table/Table.types';

import { tableHeaderBandStyles } from '../TableHeaderBand.stylex';

type ResolveBandPinnedStyleArgs = {
  readonly leading: PinnedColumnInfo | undefined;
  readonly trailing: PinnedColumnInfo | undefined;
};

/**
 * `getPinnedStyle` next door answers the same question for a single cell, where both edges
 * are the same column and the distinction cannot arise.
 */
export const resolveBandPinnedStyle = ({
  leading,
  trailing,
}: ResolveBandPinnedStyleArgs) => {
  if (leading?.side === 'left')
    return tableHeaderBandStyles.pinnedLeft(leading.offset);

  if (trailing?.side === 'right')
    return tableHeaderBandStyles.pinnedRight(trailing.offset);
};
