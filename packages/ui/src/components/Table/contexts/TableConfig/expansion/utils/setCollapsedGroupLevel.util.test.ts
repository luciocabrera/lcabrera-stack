import { describe, expect, it } from 'vite-plus/test';

import { setCollapsedGroupLevel } from './setCollapsedGroupLevel.util';

const levelPaths: ReadonlySet<string> = new Set(['a/1', 'a/2']);

describe('setCollapsedGroupLevel', () => {
  it('adds every path of the level, leaving the rest of the set alone', () => {
    const next = setCollapsedGroupLevel({
      defaultFold: 'expanded',
      isCollapsed: true,
      levelPaths,
      toggledGroupPaths: new Set(['b']),
    });

    expect([...next].toSorted((a, b) => a.localeCompare(b))).toStrictEqual([
      'a/1',
      'a/2',
      'b',
    ]);
  });

  it('removes every path of the level, leaving the rest of the set alone', () => {
    // `b` is another level the reader folded themselves, and the whole point of
    // a level-scoped action is that it survives this one.
    const next = setCollapsedGroupLevel({
      defaultFold: 'expanded',
      isCollapsed: false,
      levelPaths,
      toggledGroupPaths: new Set(['a/1', 'a/2', 'b']),
    });

    expect([...next]).toStrictEqual(['b']);
  });

  it('answers the same set instance when the level is already folded', () => {
    // Identity is what the action's early return reads, so "nothing to do" and
    // "wrote nothing" are one decision rather than two that can disagree.
    const toggledGroupPaths: ReadonlySet<string> = new Set(['a/1', 'a/2', 'b']);

    expect(
      setCollapsedGroupLevel({
        defaultFold: 'expanded',
        isCollapsed: true,
        levelPaths,
        toggledGroupPaths,
      }),
    ).toBe(toggledGroupPaths);
  });

  it('answers the same set instance when the level is already open', () => {
    const toggledGroupPaths: ReadonlySet<string> = new Set(['b']);

    expect(
      setCollapsedGroupLevel({
        defaultFold: 'expanded',
        isCollapsed: false,
        levelPaths,
        toggledGroupPaths,
      }),
    ).toBe(toggledGroupPaths);
  });

  it('answers a new set when only part of the level moves', () => {
    // Size alone decides "changed", and it is exact here because the loop only
    // ever adds or only ever deletes — a half-folded level still grows.
    const toggledGroupPaths: ReadonlySet<string> = new Set(['a/1']);
    const next = setCollapsedGroupLevel({
      defaultFold: 'expanded',
      isCollapsed: true,
      levelPaths,
      toggledGroupPaths,
    });

    expect(next).not.toBe(toggledGroupPaths);
    expect([...next].toSorted((a, b) => a.localeCompare(b))).toStrictEqual([
      'a/1',
      'a/2',
    ]);
  });

  it('never mutates the set it was handed, which the store still holds', () => {
    const toggledGroupPaths = new Set(['b']);

    setCollapsedGroupLevel({
      defaultFold: 'expanded',
      isCollapsed: true,
      levelPaths,
      toggledGroupPaths,
    });

    expect([...toggledGroupPaths]).toStrictEqual(['b']);
  });
});
