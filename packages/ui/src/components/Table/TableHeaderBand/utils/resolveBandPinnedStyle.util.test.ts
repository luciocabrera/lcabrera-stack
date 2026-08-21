import { describe, expect, it } from 'vite-plus/test';

import type { PinnedColumnInfo } from '#ui/components/Table/Table.types';

import { tableHeaderBandStyles } from '../TableHeaderBand.stylex';
import { resolveBandPinnedStyle } from './resolveBandPinnedStyle.util';

type PinArgs = {
  readonly offset: number;
  readonly side: 'left' | 'right';
};

const pin = ({ offset, side }: PinArgs) =>
  ({ offset, side }) as PinnedColumnInfo;

/**
 * The whole content of this util is which **edge** of a band each side is read
 * from, and that is a two-character edit away from being silently wrong: a
 * right-pinned band taking `leading.offset` slides by the width of the rest of
 * the run. Nothing in `Table.aggregateColumns.test.tsx` would catch it, because
 * none of its cases pins a multi-measure band — so the distinction is asserted
 * here, against bands whose two edges carry deliberately different offsets.
 */
describe('resolveBandPinnedStyle', () => {
  it('sticks a left-pinned band at its first column’s offset', () => {
    expect(
      resolveBandPinnedStyle({
        leading: pin({ offset: 40, side: 'left' }),
        trailing: pin({ offset: 220, side: 'left' }),
      }),
    ).toStrictEqual(tableHeaderBandStyles.pinnedLeft(40));
  });

  it('sticks a right-pinned band at its last column’s offset', () => {
    // The case the leading/trailing split exists for. Taking `leading` here
    // would offset the band by the rest of the run's width.
    expect(
      resolveBandPinnedStyle({
        leading: pin({ offset: 220, side: 'right' }),
        trailing: pin({ offset: 40, side: 'right' }),
      }),
    ).toStrictEqual(tableHeaderBandStyles.pinnedRight(40));
  });

  it('does not stick an unpinned band', () => {
    expect(
      resolveBandPinnedStyle({ leading: undefined, trailing: undefined }),
    ).toBeUndefined();
  });

  it('prefers the left edge when a band somehow spans both pins', () => {
    // Not reachable today — `resolveHeaderBands` is called per pinned
    // partition, so a band cannot straddle the boundary. Pinned so that the
    // order of the two checks is a decision on record rather than an accident
    // of which `if` was written first.
    expect(
      resolveBandPinnedStyle({
        leading: pin({ offset: 12, side: 'left' }),
        trailing: pin({ offset: 90, side: 'right' }),
      }),
    ).toStrictEqual(tableHeaderBandStyles.pinnedLeft(12));
  });
});
