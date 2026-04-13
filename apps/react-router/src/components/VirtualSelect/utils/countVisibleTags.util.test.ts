import { describe, expect, it } from 'vitest';

import { countVisibleTags } from './countVisibleTags.util.ts';

const makeTag = (
  offsetTop: number,
  offsetHeight: number,
  extra: Record<string, string> = {},
) => ({
  dataset: extra,
  offsetHeight,
  offsetTop,
});

const makeTrigger = (children: ReturnType<typeof makeTag>[]): HTMLDivElement =>
  ({ children }) as unknown as HTMLDivElement;

describe('countVisibleTags', () => {
  it('returns fittingCount when all tags fit', () => {
    // TRIGGER_MAX_HEIGHT = 88
    const trigger = makeTrigger([makeTag(0, 20), makeTag(24, 20)]);
    const result = countVisibleTags({ totalCount: 2, trigger });
    expect(result).toBe(2);
  });

  it('reserves 1 slot for overflow indicator when some tags do not fit', () => {
    const trigger = makeTrigger([
      makeTag(0, 20), // fits: 0+20=20 <= 88
      makeTag(24, 20), // fits: 24+20=44 <= 88
      makeTag(80, 20), // does not fit: 80+20=100 > 88
    ]);
    // fittingCount=2, overflow=3-2=1 > 0, so return max(1, 2-1)=1
    const result = countVisibleTags({ totalCount: 3, trigger });
    expect(result).toBe(1);
  });

  it('returns at least 1 when fitting is 1 and overflow exists', () => {
    const trigger = makeTrigger([
      makeTag(0, 20), // fits
      makeTag(80, 20), // does not fit
    ]);
    // fittingCount=1, overflow=2-1=1>0, return max(1,1-1)=max(1,0)=1
    const result = countVisibleTags({ totalCount: 2, trigger });
    expect(result).toBe(1);
  });

  it('ignores chevron and overflow children', () => {
    const chevron = makeTag(0, 20, { chevron: 'true' });
    const overflow = makeTag(0, 20, { overflow: 'true' });
    const tag = makeTag(0, 20);
    const trigger = makeTrigger([chevron, overflow, tag]);
    const result = countVisibleTags({ totalCount: 1, trigger });
    expect(result).toBe(1);
  });
});
