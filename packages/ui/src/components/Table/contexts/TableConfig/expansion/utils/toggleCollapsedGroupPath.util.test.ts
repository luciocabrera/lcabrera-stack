import { describe, expect, it } from 'vite-plus/test';

import { toggleCollapsedGroupPath } from './toggleCollapsedGroupPath.util';

describe('toggleCollapsedGroupPath', () => {
  it('collapses a path that was open and re-opens one that was collapsed', () => {
    const opened = new Set<string>();
    const collapsed = toggleCollapsedGroupPath({
      collapsedGroupPaths: opened,
      pathKey: 'a',
    });

    expect([...collapsed]).toStrictEqual(['a']);
    expect([
      ...toggleCollapsedGroupPath({
        collapsedGroupPaths: collapsed,
        pathKey: 'a',
      }),
    ]).toStrictEqual([]);
  });

  it('leaves every other collapsed path alone', () => {
    const next = toggleCollapsedGroupPath({
      collapsedGroupPaths: new Set(['a', 'b']),
      pathKey: 'b',
    });

    expect([...next]).toStrictEqual(['a']);
  });

  it('answers a new set, so the store can see the change at all', () => {
    const current = new Set(['a']);
    const next = toggleCollapsedGroupPath({
      collapsedGroupPaths: current,
      pathKey: 'a',
    });

    expect(next).not.toBe(current);
    expect([...current]).toStrictEqual(['a']);
  });
});
