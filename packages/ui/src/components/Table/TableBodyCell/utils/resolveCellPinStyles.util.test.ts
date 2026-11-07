import { describe, expect, it } from 'vite-plus/test';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';
import { resolveCellPinStyles } from './resolveCellPinStyles.util';

describe('resolveCellPinStyles', () => {
  it('adds nothing for an unpinned cell', () => {
    expect(resolveCellPinStyles(undefined)).toStrictEqual([
      false,
      false,
      undefined,
      undefined,
    ]);
  });

  it('pins the last left column with its shadow', () => {
    expect(
      resolveCellPinStyles({
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 16,
        side: 'left',
      }),
    ).toStrictEqual([
      tableBodyCellStyles.pinnedLeft(16),
      false,
      tableBodyCellStyles.pinnedShadowLeft,
      false,
    ]);
  });

  it('pins the first right column with its shadow', () => {
    expect(
      resolveCellPinStyles({
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 24,
        side: 'right',
      }),
    ).toStrictEqual([
      false,
      tableBodyCellStyles.pinnedRight(24),
      false,
      tableBodyCellStyles.pinnedShadowRight,
    ]);
  });
});
