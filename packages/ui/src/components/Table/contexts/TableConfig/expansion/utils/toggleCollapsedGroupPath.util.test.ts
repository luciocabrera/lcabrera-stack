import { describe, expect, it } from 'vite-plus/test';

import { toggleCollapsedGroupPath } from './toggleCollapsedGroupPath.util';

describe('toggleCollapsedGroupPath', () => {
  it('collapses a path that was open and re-opens one that was collapsed', () => {
    const opened = new Set<string>();
    const collapsed = toggleCollapsedGroupPath({
      pathKey: 'a',
      toggledGroupPaths: opened,
    });

    expect([...collapsed]).toStrictEqual(['a']);
    expect([
      ...toggleCollapsedGroupPath({
        pathKey: 'a',
        toggledGroupPaths: collapsed,
      }),
    ]).toStrictEqual([]);
  });

  it('leaves every other collapsed path alone', () => {
    const next = toggleCollapsedGroupPath({
      pathKey: 'b',
      toggledGroupPaths: new Set(['a', 'b']),
    });

    expect([...next]).toStrictEqual(['a']);
  });

  it('answers a new set, so the store can see the change at all', () => {
    const current = new Set(['a']);
    const next = toggleCollapsedGroupPath({
      pathKey: 'a',
      toggledGroupPaths: current,
    });

    expect(next).not.toBe(current);
    expect([...current]).toStrictEqual(['a']);
  });
});
