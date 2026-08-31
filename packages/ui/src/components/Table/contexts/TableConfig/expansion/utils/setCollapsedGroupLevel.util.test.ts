import { describe, expect, it } from 'vite-plus/test';

import { setCollapsedGroupLevel } from './setCollapsedGroupLevel.util';

const levelPaths: ReadonlySet<string> = new Set(['a/1', 'a/2']);

describe('setCollapsedGroupLevel', () => {
  it('adds every path of the level, leaving the rest of the set alone', () => {
    const next = setCollapsedGroupLevel({
      collapsedGroupPaths: new Set(['b']),
      isCollapsed: true,
      levelPaths,
    });

    expect([...next].toSorted((a, b) => a.localeCompare(b))).toStrictEqual([
      'a/1',
      'a/2',
      'b',
    ]);
  });

  it('removes every path of the level, leaving the rest of the set alone', () => {
    const next = setCollapsedGroupLevel({
      collapsedGroupPaths: new Set(['a/1', 'a/2', 'b']),
      isCollapsed: false,
      levelPaths,
    });

    expect([...next]).toStrictEqual(['b']);
  });

  it('answers the same set instance when the level is already folded', () => {
    const collapsedGroupPaths: ReadonlySet<string> = new Set([
      'a/1',
      'a/2',
      'b',
    ]);

    expect(
      setCollapsedGroupLevel({
        collapsedGroupPaths,
        isCollapsed: true,
        levelPaths,
      }),
    ).toBe(collapsedGroupPaths);
  });

  it('answers the same set instance when the level is already open', () => {
    const collapsedGroupPaths: ReadonlySet<string> = new Set(['b']);

    expect(
      setCollapsedGroupLevel({
        collapsedGroupPaths,
        isCollapsed: false,
        levelPaths,
      }),
    ).toBe(collapsedGroupPaths);
  });

  it('answers a new set when only part of the level moves', () => {
    const collapsedGroupPaths: ReadonlySet<string> = new Set(['a/1']);
    const next = setCollapsedGroupLevel({
      collapsedGroupPaths,
      isCollapsed: true,
      levelPaths,
    });

    expect(next).not.toBe(collapsedGroupPaths);
    expect([...next].toSorted((a, b) => a.localeCompare(b))).toStrictEqual([
      'a/1',
      'a/2',
    ]);
  });

  it('never mutates the set it was handed, which the store still holds', () => {
    const collapsedGroupPaths = new Set(['b']);

    setCollapsedGroupLevel({
      collapsedGroupPaths,
      isCollapsed: true,
      levelPaths,
    });

    expect([...collapsedGroupPaths]).toStrictEqual(['b']);
  });
});
