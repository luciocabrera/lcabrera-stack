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

const paris = [{ columnKey: 'city', label: 'Paris' }];
const berlin = [{ columnKey: 'city', label: 'Berlin' }];

describe('pruneCollapsedGroupPaths', () => {
  it('keeps a collapse whose group the new rows still contain', () => {
    // A sort reorders rows without touching any group's key values, which is
    // what makes expansion survive one.
    const collapsedGroupPaths = new Set([resolveGroupPathKey(paris)]);
    const kept = pruneCollapsedGroupPaths({
      collapsedGroupPaths,
      data: [groupRow(berlin), { id: 2 }, groupRow(paris), { id: 1 }],
    });

    expect(kept).toBe(collapsedGroupPaths);
  });

  it('drops a collapse whose group the new rows no longer contain', () => {
    const kept = pruneCollapsedGroupPaths({
      collapsedGroupPaths: new Set([
        resolveGroupPathKey(berlin),
        resolveGroupPathKey(paris),
      ]),
      data: [groupRow(berlin), { id: 2 }],
    });

    expect([...kept]).toStrictEqual([resolveGroupPathKey(berlin)]);
  });

  it('answers the same set when nothing was dropped, so no store write follows', () => {
    // The caller compares by identity; a fresh set every time would write the
    // store on every load and re-enter the effect that called it.
    const collapsedGroupPaths = new Set<string>();

    expect(
      pruneCollapsedGroupPaths({ collapsedGroupPaths, data: [{ id: 1 }] }),
    ).toBe(collapsedGroupPaths);
  });

  it('drops every collapse when a filter empties the result', () => {
    const kept = pruneCollapsedGroupPaths({
      collapsedGroupPaths: new Set([resolveGroupPathKey(paris)]),
      data: [],
    });

    expect([...kept]).toStrictEqual([]);
  });
});
