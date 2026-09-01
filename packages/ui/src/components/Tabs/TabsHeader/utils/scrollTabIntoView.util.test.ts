import { describe, expect, it } from 'vite-plus/test';

import { scrollTabIntoView } from './scrollTabIntoView.util';

type TabArgs = {
  readonly offsetLeft: number;
  readonly offsetWidth?: number;
};

type ViewportArgs = {
  readonly clientWidth: number;
  readonly scrollLeft: number;
};

const tabAt = ({ offsetLeft, offsetWidth = 100 }: TabArgs) =>
  ({ offsetLeft, offsetWidth }) as HTMLElement;

const viewportAt = ({ clientWidth, scrollLeft }: ViewportArgs) =>
  ({ clientWidth, scrollLeft }) as HTMLElement;

describe('scrollTabIntoView', () => {
  it('leaves a tab already inside the viewport where it is', () => {
    const viewport = viewportAt({ clientWidth: 300, scrollLeft: 50 });

    scrollTabIntoView({ tab: tabAt({ offsetLeft: 80 }), viewport });

    expect(viewport.scrollLeft).toBe(50);
  });

  it('scrolls back to a tab that starts before the viewport', () => {
    const viewport = viewportAt({ clientWidth: 300, scrollLeft: 200 });

    scrollTabIntoView({ tab: tabAt({ offsetLeft: 120 }), viewport });

    expect(viewport.scrollLeft).toBe(120);
  });

  it('scrolls forward just far enough to end a tab at the edge', () => {
    const viewport = viewportAt({ clientWidth: 300, scrollLeft: 0 });

    scrollTabIntoView({ tab: tabAt({ offsetLeft: 400 }), viewport });

    expect(viewport.scrollLeft).toBe(200);
  });

  it('does nothing without both a tab and a viewport', () => {
    const viewport = viewportAt({ clientWidth: 300, scrollLeft: 40 });

    scrollTabIntoView({ tab: undefined, viewport });
    scrollTabIntoView({ tab: tabAt({ offsetLeft: 400 }), viewport: undefined });

    expect(viewport.scrollLeft).toBe(40);
  });
});
