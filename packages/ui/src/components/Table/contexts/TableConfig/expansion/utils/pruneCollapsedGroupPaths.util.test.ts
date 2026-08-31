import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { pruneCollapsedGroupPaths } from './pruneCollapsedGroupPaths.util';

type Row = Record<string, unknown>;

const groupRow = (path: readonly TableGroupKeyValue[]): Row => ({
  [TABLE_GROUP_ROW_FIELD]: {
    aggregates: [],
    count: 1,
    isSubtotal: false,
    path,
  },
});

const paris = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin', value: 'Berlin' }];

describe('pruneCollapsedGroupPaths', () => {
  it('keeps a collapse whose group the new rows still contain', () => {
    // A sort reorders rows without touching any group's key values, which is
    // what makes expansion survive one.
    const toggledGroupPaths = new Set([resolveGroupPathKey(paris)]);
    const kept = pruneCollapsedGroupPaths({
      data: [groupRow(berlin), { id: 2 }, groupRow(paris), { id: 1 }],
      toggledGroupPaths,
    });

    expect(kept).toBe(toggledGroupPaths);
  });

  it('drops a collapse whose group the new rows no longer contain', () => {
    const kept = pruneCollapsedGroupPaths({
      data: [groupRow(berlin), { id: 2 }],
      toggledGroupPaths: new Set([
        resolveGroupPathKey(berlin),
        resolveGroupPathKey(paris),
      ]),
    });

    expect([...kept]).toStrictEqual([resolveGroupPathKey(berlin)]);
  });

  it('answers the same set when nothing was dropped, so no store write follows', () => {
    // The caller compares by identity; a fresh set every time would write the
    // store on every load and re-enter the effect that called it.
    const toggledGroupPaths = new Set<string>();

    expect(
      pruneCollapsedGroupPaths({ data: [{ id: 1 }], toggledGroupPaths }),
    ).toBe(toggledGroupPaths);
  });

  it('drops every collapse when a filter empties the result', () => {
    const kept = pruneCollapsedGroupPaths({
      data: [],
      toggledGroupPaths: new Set([resolveGroupPathKey(paris)]),
    });

    expect([...kept]).toStrictEqual([]);
  });
});
