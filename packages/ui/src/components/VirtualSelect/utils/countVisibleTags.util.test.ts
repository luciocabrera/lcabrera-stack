import { describe, expect, it } from 'vite-plus/test';

import { countVisibleTags } from './countVisibleTags.util';

const makeTag = ({
  extra = {},
  offsetTop,
}: {
  readonly extra?: Record<string, string>;
  readonly offsetTop: number;
}) => ({
  dataset: extra,
  offsetHeight: 24,
  offsetTop,
});

const makeTrigger = (children: ReturnType<typeof makeTag>[]): HTMLDivElement =>
  ({ children }) as unknown as HTMLDivElement;

describe('countVisibleTags', () => {
  it('returns every tag when they all sit on the first row', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
    ]);

    expect(countVisibleTags({ totalCount: 2, trigger })).toBe(2);
  });

  it('counts only the first row, whatever the label above the trigger offsets it by', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 45 }),
      makeTag({ offsetTop: 45 }),
      makeTag({ offsetTop: 45 }),
      makeTag({ offsetTop: 77 }),
    ]);

    expect(countVisibleTags({ totalCount: 4, trigger })).toBe(2);
  });

  it('reserves one slot for the overflow badge when a tag wraps', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 37 }),
    ]);

    expect(countVisibleTags({ totalCount: 3, trigger })).toBe(1);
  });

  it('keeps at least one tag even when only one fits', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 37 }),
    ]);

    expect(countVisibleTags({ totalCount: 2, trigger })).toBe(1);
  });

  it('ignores the chevron and the overflow badge', () => {
    const trigger = makeTrigger([
      makeTag({ extra: { chevron: '' }, offsetTop: 0 }),
      makeTag({ extra: { overflow: '' }, offsetTop: 0 }),
      makeTag({ offsetTop: 5 }),
    ]);

    expect(countVisibleTags({ totalCount: 1, trigger })).toBe(1);
  });

  it('keeps a reduced set whose tags, badge and chevron all share the first row', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ extra: { overflow: '' }, offsetTop: 5 }),
      makeTag({ extra: { chevron: '' }, offsetTop: 15 }),
    ]);

    expect(countVisibleTags({ totalCount: 5, trigger })).toBe(2);
  });

  it('gives up one more tag when the badge wrapped below the first row', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ extra: { overflow: '' }, offsetTop: 37 }),
    ]);

    expect(countVisibleTags({ totalCount: 5, trigger })).toBe(1);
  });

  it('reports no tags when none is rendered', () => {
    expect(countVisibleTags({ totalCount: 0, trigger: makeTrigger([]) })).toBe(
      0,
    );
  });

  it('caps the count at the total while stale tags from a larger selection are still rendered', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
    ]);

    expect(countVisibleTags({ totalCount: 2, trigger })).toBe(2);
  });

  it('shows every tag once they all fit, even when the chevron has wrapped', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ extra: { chevron: '' }, offsetTop: 37 }),
    ]);

    expect(countVisibleTags({ totalCount: 2, trigger })).toBe(2);
  });

  it('treats a badge starting exactly at the bottom of the first row as wrapped', () => {
    const trigger = makeTrigger([
      makeTag({ offsetTop: 5 }),
      makeTag({ offsetTop: 5 }),
      makeTag({ extra: { overflow: '' }, offsetTop: 29 }),
    ]);

    expect(countVisibleTags({ totalCount: 5, trigger })).toBe(1);
  });
});
