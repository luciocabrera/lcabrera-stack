import { describe, expect, it } from 'vite-plus/test';

import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveGroupTreeNodes } from './resolveGroupTreeNodes.util';

const emea: readonly TableGroupKeyValue[] = [
  { columnKey: 'region', label: 'EMEA', value: 'EMEA' },
];
const spain: readonly TableGroupKeyValue[] = [
  ...emea,
  { columnKey: 'country', label: 'Spain', value: 'Spain' },
];

type SummaryArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

const summary = ({
  isSubtotal = false,
  path,
}: SummaryArgs): TableGroupRowSummary => ({
  aggregates: [],
  count: 3,
  isSubtotal,
  path,
});

const noneCollapsed = new Set<string>();

const nodesFor = (summaries: readonly (TableGroupRowSummary | undefined)[]) =>
  resolveGroupTreeNodes({ collapsedGroupPaths: noneCollapsed, summaries });

describe('resolveGroupTreeNodes', () => {
  it('takes a group row level and parent from its own path', () => {
    const [root, child] = nodesFor([
      summary({ path: emea }),
      summary({ path: spain }),
    ]);

    expect(root?.level).toBe(1);
    expect(root?.parentKey).toBe('');
    expect(child?.level).toBe(2);
    expect(child?.parentKey).toBe(resolveGroupPathKey(emea));
  });

  it('reads the same ancestry when the parent is emitted after its children', () => {
    // Rollup's order (#570). Position moved; the prefixes did not, so neither
    // row's place in the tree changes.
    const [child, root] = nodesFor([
      summary({ path: spain }),
      summary({ isSubtotal: true, path: emea }),
    ]);

    expect(child?.level).toBe(2);
    expect(child?.parentKey).toBe(resolveGroupPathKey(emea));
    expect(root?.level).toBe(1);
    expect(root?.parentKey).toBe('');
  });

  it('puts the grand total at the top level, as a sibling of the roots', () => {
    // A rollup's last row is keyed by nothing. `path.length` alone is `0` —
    // not a level at all, and invalid for `aria-level`, which is 1-based.
    const [grandTotal] = nodesFor([summary({ isSubtotal: true, path: [] })]);

    expect(grandTotal?.level).toBe(1);
  });

  it('gives the grand total the root as its parent, never itself', () => {
    // The discriminating assertion: `resolveGroupPathKey([])` is `"[]"`, which
    // is exactly this row's own path key — so a prefix branch reached with an
    // empty path makes the grand total its own parent, and the whole grid ends
    // up inside one collapsible subtree.
    const [grandTotal] = nodesFor([summary({ isSubtotal: true, path: [] })]);

    expect(grandTotal?.pathKey).toBe(resolveGroupPathKey([]));
    expect(grandTotal?.parentKey).toBe('');
    expect(grandTotal?.parentKey).not.toBe(grandTotal?.pathKey);
  });

  it('keeps the root key distinct from every path key it could meet', () => {
    // `JSON.stringify` over an array always starts `[`, the empty one included,
    // so no group's key can collide with the root.
    expect(resolveGroupPathKey([])).not.toBe('');
  });

  it('attributes a detail row to the nearest group row above it', () => {
    const [, detail] = nodesFor([summary({ path: emea }), undefined]);

    expect(detail?.level).toBe(2);
    expect(detail?.parentKey).toBe(resolveGroupPathKey(emea));
    expect(detail?.pathKey).toBeUndefined();
  });
});
