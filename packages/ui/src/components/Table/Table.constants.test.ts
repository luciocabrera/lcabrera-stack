import { describe, expect, it } from 'vite-plus/test';

import {
  MAX_TABLE_COUNT_DISTINCT_AGGREGATES,
  MAX_TABLE_GROUP_KEYS,
  TABLE_AGGREGATE_FNS,
  TABLE_AGGREGATE_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_SCALE,
} from './Table.constants';

describe('table aggregate vocabulary', () => {
  it('offers every aggregate the label map declares, and no other', () => {
    expect(new Set(TABLE_AGGREGATE_FNS)).toStrictEqual(
      new Set(Object.keys(TABLE_AGGREGATE_LABELS)),
    );
  });

  it('lists each aggregate once', () => {
    expect(TABLE_AGGREGATE_FNS).toHaveLength(new Set(TABLE_AGGREGATE_FNS).size);
  });
});

describe('group key depth cap', () => {
  it('admits more than one key and stays finite', () => {
    expect(MAX_TABLE_GROUP_KEYS).toBeGreaterThan(1);
    expect(Number.isSafeInteger(MAX_TABLE_GROUP_KEYS)).toBe(true);
  });
});

describe('countDistinct budget', () => {
  it('admits at least one and stays finite', () => {
    expect(MAX_TABLE_COUNT_DISTINCT_AGGREGATES).toBeGreaterThan(0);
    expect(Number.isSafeInteger(MAX_TABLE_COUNT_DISTINCT_AGGREGATES)).toBe(
      true,
    );
  });
});

describe('TABLE_DENSITY_SCALE', () => {
  const FONT_ORDER = ['fontSizeXs', 'fontSizeSm', 'fontSizeMd'];

  it.each(TABLE_DENSITY_LEVELS)(
    'keeps the %s header band no larger than its header, and below it wherever a smaller size exists',
    (level) => {
      const { headerBandFontSize, headerFontSize } = TABLE_DENSITY_SCALE[level];
      const band = FONT_ORDER.indexOf(headerBandFontSize);
      const header = FONT_ORDER.indexOf(headerFontSize);

      expect(band).toBe(Math.max(header - 1, 0));
    },
  );

  it('grows the row height with each level, tightest first', () => {
    expect(
      TABLE_DENSITY_LEVELS.map((level) => TABLE_DENSITY_SCALE[level].rowHeight),
    ).toStrictEqual([24, 32, 40, 48]);
  });
});
