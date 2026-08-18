import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { resolveCarriedGroupKeys } from './resolveCarriedGroupKeys.util';

const summaryOf = (
  path: readonly (readonly [string, string])[],
): TableGroupRowSummary => ({
  aggregates: [],
  count: 1,
  isSubtotal: false,
  path: path.map(([columnKey, label]) => ({ columnKey, label, value: label })),
});

const rowOf = (path: readonly (readonly [string, string])[]) => ({
  [TABLE_GROUP_ROW_FIELD]: summaryOf(path),
});

const PARIS_MARAIS = [
  ['city', 'Paris'],
  ['district', 'Marais'],
] as const;

describe('resolveCarriedGroupKeys', () => {
  it('carries an ancestor the row above already states', () => {
    expect([
      ...resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: rowOf(PARIS_MARAIS),
        summary: summaryOf([
          ['city', 'Paris'],
          ['district', 'Belleville'],
        ]),
      }),
    ]).toStrictEqual(['city']);
  });

  it("never carries the row's own innermost level", () => {
    // Two identical rows: every level matches, and the innermost is still drawn
    // so the row states something and the disclosure has a cell to sit in.
    expect([
      ...resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: rowOf(PARIS_MARAIS),
        summary: summaryOf(PARIS_MARAIS),
      }),
    ]).toStrictEqual(['city']);
  });

  it('refills every level at the top of the rendered window', () => {
    // The ancestor was scrolled past, so carrying it would state the block the
    // reader is inside nowhere at all (ADR-080).
    expect(
      resolveCarriedGroupKeys({
        isWindowFirst: true,
        previousRow: rowOf(PARIS_MARAIS),
        summary: summaryOf([
          ['city', 'Paris'],
          ['district', 'Belleville'],
        ]),
      }).size,
    ).toBe(0);
  });

  it('refills after a detail row, which states no level of its own', () => {
    // This is what makes a drilled group read correctly with no rule of its
    // own: the group row after a block of drilled rows restates its ancestry.
    expect(
      resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: { city: 'Paris', district: 'Marais', id: 1 },
        summary: summaryOf([
          ['city', 'Paris'],
          ['district', 'Belleville'],
        ]),
      }).size,
    ).toBe(0);
  });

  it('stops at the first level that differs', () => {
    // `Marais` under a different city is a different group, and blanking it
    // would say the two were the same one.
    expect([
      ...resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: rowOf(PARIS_MARAIS),
        summary: summaryOf([
          ['city', 'Berlin'],
          ['district', 'Marais'],
          ['block', 'A'],
        ]),
      }),
    ]).toStrictEqual([]);
  });

  it('carries nothing for a detail row', () => {
    expect(
      resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: rowOf(PARIS_MARAIS),
        summary: undefined,
      }).size,
    ).toBe(0);
  });

  it('carries nothing when there is no row above at all', () => {
    expect(
      resolveCarriedGroupKeys({
        isWindowFirst: false,
        previousRow: undefined,
        summary: summaryOf(PARIS_MARAIS),
      }).size,
    ).toBe(0);
  });
});
