import type { PinnedColumnInfo } from '#ui/components/Table/Table.types';

import { tableHeaderBandStyles } from '../TableHeaderBand.stylex';

type ResolveBandPinnedStyleArgs = {
  readonly leading: PinnedColumnInfo | undefined;
  readonly trailing: PinnedColumnInfo | undefined;
};

export const resolveBandPinnedStyle = ({
  leading,
  trailing,
}: ResolveBandPinnedStyleArgs) => {
  if (leading?.side === 'left')
    return tableHeaderBandStyles.pinnedLeft(leading.offset);

  if (trailing?.side === 'right')
    return tableHeaderBandStyles.pinnedRight(trailing.offset);
};
