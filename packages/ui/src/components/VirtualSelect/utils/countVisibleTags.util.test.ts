import { describe, expect, it } from 'vite-plus/test';

import { countVisibleTags } from './countVisibleTags.util';

const makeTag = ({
  extra = {},
  offsetHeight,
  offsetTop,
}: {
  readonly extra?: Record<string, string>;
  readonly offsetHeight: number;
  readonly offsetTop: number;
}) => ({
  dataset: extra,
  offsetHeight,
  offsetTop,
});

const makeTrigger = (children: ReturnType<typeof makeTag>[]): HTMLDivElement =>
  ({ children }) as unknown as HTMLDivElement;

describe('countVisibleTags', () => {
  it('returns fittingCount when all tags fit', () => {
    // TRIGGER_MAX_HEIGHT = 88
    const trigger = makeTrigger([
      makeTag({ offsetHeight: 20, offsetTop: 0 }),
      makeTag({ offsetHeight: 20, offsetTop: 24 }),
    ]);
    const result = countVisibleTags({ totalCount: 2, trigger });
    expect(result).toBe(2);
  });

  it('reserves 1 slot for overflow indicator when some tags do not fit', () => {
    const trigger = makeTrigger([
      makeTag({ offsetHeight: 20, offsetTop: 0 }), // fits: 0+20=20 <= 88
      makeTag({ offsetHeight: 20, offsetTop: 24 }), // fits: 24+20=44 <= 88
      makeTag({ offsetHeight: 20, offsetTop: 80 }), // does not fit: 80+20=100 > 88
    ]);
    // fittingCount=2, overflow=3-2=1 > 0, so return max(1, 2-1)=1
    const result = countVisibleTags({ totalCount: 3, trigger });
    expect(result).toBe(1);
  });

  it('returns at least 1 when fitting is 1 and overflow exists', () => {
    const trigger = makeTrigger([
      makeTag({ offsetHeight: 20, offsetTop: 0 }), // fits
      makeTag({ offsetHeight: 20, offsetTop: 80 }), // does not fit
    ]);
    // fittingCount=1, overflow=2-1=1>0, return max(1,1-1)=max(1,0)=1
    const result = countVisibleTags({ totalCount: 2, trigger });
    expect(result).toBe(1);
  });

  it('ignores chevron and overflow children', () => {
    const chevron = makeTag({
      extra: { chevron: 'true' },
      offsetHeight: 20,
      offsetTop: 0,
    });
    const overflow = makeTag({
      extra: { overflow: 'true' },
      offsetHeight: 20,
      offsetTop: 0,
    });
    const tag = makeTag({ offsetHeight: 20, offsetTop: 0 });
    const trigger = makeTrigger([chevron, overflow, tag]);
    const result = countVisibleTags({ totalCount: 1, trigger });
    expect(result).toBe(1);
  });
});
