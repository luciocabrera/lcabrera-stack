import { describe, expect, it } from 'vite-plus/test';

import type { GroupTreeNode } from './resolveGroupTreeNodes.util';

import { collectFoldableGroupPaths } from './collectFoldableGroupPaths.util';

const node = ({
  level = 1,
  parentKey = '',
  pathKey,
}: {
  readonly level?: number;
  readonly parentKey?: string;
  readonly pathKey?: string;
}): GroupTreeNode => ({ isVisible: true, level, parentKey, pathKey });

describe('collectFoldableGroupPaths', () => {
  it('offers a group that owns rows and has a row of its own', () => {
    // The rollup shape: the subtotal row *is* `berlin`, and the deeper rows
    // name it as their parent — so folding it leaves the subtotal behind.
    const nodes = [
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/open' }),
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/shut' }),
      node({ level: 1, pathKey: 'berlin' }),
    ];

    expect([...collectFoldableGroupPaths(nodes)]).toStrictEqual(['berlin']);
  });

  it('refuses a group that owns rows but has no row of its own', () => {
    // The `flat` shape: every emitted row carries the full key list, so
    // `berlin` is a parent and nothing renders it. Folding it would hide both
    // rows and leave nothing behind to reopen it from (#774).
    const nodes = [
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/open' }),
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/shut' }),
    ];

    expect([...collectFoldableGroupPaths(nodes)]).toStrictEqual([]);
  });

  it('refuses a rendered group that owns nothing', () => {
    const nodes = [node({ pathKey: 'berlin' }), node({ pathKey: 'paris' })];

    expect([...collectFoldableGroupPaths(nodes)]).toStrictEqual([]);
  });

  it('never offers the root, which no row renders and every top level names', () => {
    // Its key is the empty string, so a set built from parent keys alone would
    // carry it — and collapsing it would hide the whole table.
    const nodes = [node({ pathKey: 'berlin' }), node({ parentKey: '' })];

    expect(collectFoldableGroupPaths(nodes).has('')).toBe(false);
  });

  it('reads ownership off the tree, not off which row came first', () => {
    // Rollup emits a subtotal *after* the rows it totals (#570). The same three
    // nodes in the opposite order must give the same answer, or the result
    // depends on emission order and every subtotal reads as childless.
    const parents = [
      node({ level: 1, pathKey: 'berlin' }),
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/open' }),
    ];
    const children = [
      node({ level: 2, parentKey: 'berlin', pathKey: 'berlin/open' }),
      node({ level: 1, pathKey: 'berlin' }),
    ];

    expect([...collectFoldableGroupPaths(parents)]).toStrictEqual([
      ...collectFoldableGroupPaths(children),
    ]);
  });
});
