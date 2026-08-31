import { describe, expect, it } from 'vite-plus/test';

import type { DraggableItem } from '../DraggableList.types';

import { countFragmentedGroups } from './countFragmentedGroups.util';

const toItems = (
  spec: readonly (string | undefined)[],
): readonly DraggableItem[] =>
  spec.map((groupId, index) => ({
    content: undefined,
    id: String(index),
    ...(groupId !== undefined && { groupId }),
  }));

const run = (spec: readonly (string | undefined)[]) =>
  countFragmentedGroups(toItems(spec));

describe('countFragmentedGroups', () => {
  it('counts none when every group sits in one run', () => {
    expect(run(['total', 'total', 'total', 'order'])).toBe(0);
    expect(run(['order', 'total', 'total', 'total'])).toBe(0);
  });

  it('counts a group split by another group', () => {
    expect(run(['total', 'order', 'total'])).toBe(1);
  });

  it('counts a group split by an ungrouped item', () => {
    expect(run(['total', undefined, 'total'])).toBe(1);
  });

  it('counts none for an ungrouped item outside every run', () => {
    expect(run([undefined, 'total', 'total', undefined])).toBe(0);
  });

  it('counts none for a list with no groups at all, which is every other consumer', () => {
    expect(run([undefined, undefined, undefined])).toBe(0);
  });

  it('counts none for an empty list and a single item', () => {
    expect(run([])).toBe(0);
    expect(run(['total'])).toBe(0);
  });

  it('counts each split group separately, which is what makes it comparable', () => {
    // A yes/no answer reads this and `['a', 'b', 'a']` the same, so a drop that
    // splits a second group could not be told from one that split none.
    expect(run(['a', 'b', 'a', 'b'])).toBe(2);
    expect(run(['a', 'b', 'a'])).toBe(1);
  });
});
