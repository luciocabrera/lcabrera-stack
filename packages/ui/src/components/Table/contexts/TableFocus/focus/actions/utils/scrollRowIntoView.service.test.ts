// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { scrollRowIntoView } from './scrollRowIntoView.service';

const ROW_HEIGHT = 40;
const VIEW_HEIGHT = 400;

const createContainer = (scrollTop: number) => {
  const container = document.createElement('div');

  Object.defineProperties(container, {
    clientHeight: { configurable: true, value: VIEW_HEIGHT },
    scrollTop: { configurable: true, value: scrollTop, writable: true },
  });

  return container;
};

describe('scrollRowIntoView', () => {
  it('leaves a row that is already inside the viewport alone', () => {
    const container = createContainer(400);

    scrollRowIntoView({ container, rowHeight: ROW_HEIGHT, rowIndex: 12 });

    expect(container.scrollTop).toBe(400);
  });

  it('scrolls up so a row above the viewport sits at its top', () => {
    const container = createContainer(400);

    scrollRowIntoView({ container, rowHeight: ROW_HEIGHT, rowIndex: 3 });

    expect(container.scrollTop).toBe(120);
  });

  it('scrolls down so a row below the viewport sits at its bottom', () => {
    const container = createContainer(400);

    scrollRowIntoView({ container, rowHeight: ROW_HEIGHT, rowIndex: 30 });

    expect(container.scrollTop).toBe(
      30 * ROW_HEIGHT + ROW_HEIGHT - VIEW_HEIGHT,
    );
  });

  it('leaves the boundary rows alone, so a move within the window never jerks', () => {
    const container = createContainer(400);

    scrollRowIntoView({ container, rowHeight: ROW_HEIGHT, rowIndex: 10 });
    expect(container.scrollTop).toBe(400);

    scrollRowIntoView({ container, rowHeight: ROW_HEIGHT, rowIndex: 19 });
    expect(container.scrollTop).toBe(400);
  });

  it('does nothing without a container or a row height', () => {
    const container = createContainer(400);

    scrollRowIntoView({
      container: undefined,
      rowHeight: ROW_HEIGHT,
      rowIndex: 30,
    });
    scrollRowIntoView({ container, rowHeight: 0, rowIndex: 30 });

    expect(container.scrollTop).toBe(400);
  });
});
