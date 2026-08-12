// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { getGridPageRows } from './getGridPageRows.util';

const createContainer = (clientHeight: number) => {
  const container = document.createElement('div');

  Object.defineProperty(container, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  });

  return container;
};

describe('getGridPageRows', () => {
  it('is a viewport of whole rows', () => {
    expect(
      getGridPageRows({ container: createContainer(400), rowHeight: 40 }),
    ).toBe(10);
  });

  it('rounds down, so a page never overshoots what is on screen', () => {
    expect(
      getGridPageRows({ container: createContainer(410), rowHeight: 40 }),
    ).toBe(10);
  });

  it('is at least one row when the container has not been measured', () => {
    // Zero would leave PageUp/PageDown silently dead.
    expect(
      getGridPageRows({ container: createContainer(0), rowHeight: 40 }),
    ).toBe(1);
    expect(getGridPageRows({ container: undefined, rowHeight: 40 })).toBe(1);
    expect(
      getGridPageRows({ container: createContainer(400), rowHeight: 0 }),
    ).toBe(1);
  });
});
