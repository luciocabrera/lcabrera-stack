import { describe, expect, it } from 'vite-plus/test';

import { scrollTabIntoView } from './scrollTabIntoView.util';

type BoxArgs = {
  readonly left: number;
  readonly right: number;
};

type ViewportArgs = BoxArgs & {
  readonly scrollLeft: number;
};

const boxOf = ({ left, right }: BoxArgs) => ({ left, right }) as DOMRect;

const tabAt = ({ left, right }: BoxArgs) =>
  ({ getBoundingClientRect: () => boxOf({ left, right }) }) as HTMLElement;

const viewportAt = ({ left, right, scrollLeft }: ViewportArgs) =>
  ({
    getBoundingClientRect: () => boxOf({ left, right }),
    scrollLeft,
  }) as HTMLElement;

describe('scrollTabIntoView', () => {
  it('leaves a tab already inside the viewport where it is', () => {
    const viewport = viewportAt({ left: 100, right: 400, scrollLeft: 50 });

    scrollTabIntoView({ tab: tabAt({ left: 120, right: 220 }), viewport });

    expect(viewport.scrollLeft).toBe(50);
  });

  it('scrolls back by the distance a tab starts before the viewport', () => {
    const viewport = viewportAt({ left: 100, right: 400, scrollLeft: 200 });

    scrollTabIntoView({ tab: tabAt({ left: 20, right: 120 }), viewport });

    expect(viewport.scrollLeft).toBe(120);
  });

  it('scrolls forward just far enough to end a tab at the edge', () => {
    const viewport = viewportAt({ left: 100, right: 400, scrollLeft: 0 });

    scrollTabIntoView({ tab: tabAt({ left: 450, right: 550 }), viewport });

    expect(viewport.scrollLeft).toBe(150);
  });

  it('reads both boxes from one origin, so a page offset moves neither', () => {
    const viewport = viewportAt({ left: 640, right: 940, scrollLeft: 80 });

    scrollTabIntoView({ tab: tabAt({ left: 700, right: 800 }), viewport });

    expect(viewport.scrollLeft).toBe(80);
  });

  it('does nothing without both a tab and a viewport', () => {
    const viewport = viewportAt({ left: 0, right: 300, scrollLeft: 40 });

    scrollTabIntoView({ tab: undefined, viewport });
    scrollTabIntoView({
      tab: tabAt({ left: 400, right: 500 }),
      viewport: undefined,
    });

    expect(viewport.scrollLeft).toBe(40);
  });
});
