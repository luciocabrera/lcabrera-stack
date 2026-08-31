import { describe, expect, it } from 'vite-plus/test';

import type { DraggableItem } from '../DraggableList.types';

import { isGroupedOrderContiguous } from './isGroupedOrderContiguous.util';

const toItems = (
  spec: readonly (string | undefined)[],
): readonly DraggableItem[] =>
  spec.map((groupId, index) => ({
    content: undefined,
    id: String(index),
    ...(groupId !== undefined && { groupId }),
  }));

const run = (spec: readonly (string | undefined)[]) =>
  isGroupedOrderContiguous(toItems(spec));

describe('isGroupedOrderContiguous', () => {
  it('accepts a list whose groups each sit in one run', () => {
    expect(run(['total', 'total', 'total', 'order'])).toBe(true);
    expect(run(['order', 'total', 'total', 'total'])).toBe(true);
  });

  it('rejects a group split by another group', () => {
    expect(run(['total', 'order', 'total'])).toBe(false);
  });

  it('rejects a group split by an ungrouped item', () => {
    expect(run(['total', undefined, 'total'])).toBe(false);
  });

  it('accepts an ungrouped item outside every run', () => {
    expect(run([undefined, 'total', 'total', undefined])).toBe(true);
  });

  it('accepts a list with no groups at all, which is every other consumer', () => {
    expect(run([undefined, undefined, undefined])).toBe(true);
  });

  it('accepts an empty list and a single item', () => {
    expect(run([])).toBe(true);
    expect(run(['total'])).toBe(true);
  });

  it('reads three interleaved groups as broken', () => {
    expect(run(['a', 'b', 'a', 'b'])).toBe(false);
  });
});
