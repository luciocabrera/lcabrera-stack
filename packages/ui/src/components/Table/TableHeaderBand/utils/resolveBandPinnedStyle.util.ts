import type { PinnedColumnInfo } from '#ui/components/Table/Table.types';

import { tableHeaderBandStyles } from '../TableHeaderBand.stylex';

type ResolveBandPinnedStyleArgs = {
  /** The pin info of the band's **first** column. */
  readonly leading: PinnedColumnInfo | undefined;
  /** The pin info of the band's **last** column. */
  readonly trailing: PinnedColumnInfo | undefined;
};

/**
 * Where a band sticks, or `undefined` when it scrolls with the grid.
 *
 * **Each side is read from the edge of the band that faces it.** A left-pinned
 * band starts where its first column starts and a right-pinned one ends where
 * its last column ends, so taking the wrong edge slides the band by the width
 * of the rest of the run. `getPinnedStyle` next door answers the same question
 * for a single cell, where both edges are the same column and the distinction
 * cannot arise.
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
