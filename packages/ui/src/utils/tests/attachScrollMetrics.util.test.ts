// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import { attachScrollMetrics } from './attachScrollMetrics.util';

describe('attachScrollMetrics', () => {
  it('does nothing when the container is missing', () => {
    expect(() =>
      attachScrollMetrics({ container: undefined, height: 400 }),
    ).not.toThrow();
  });

  it('defines viewport metrics on a bare element', () => {
    const container = document.createElement('div');

    attachScrollMetrics({ container, height: 400 });

    expect(container.clientHeight).toBe(400);
    expect(container.offsetHeight).toBe(400);
    expect(container.scrollTop).toBe(0);
  });

  it('leaves an already-stubbed container alone', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      value: 80,
      writable: true,
    });

    attachScrollMetrics({ container, height: 400 });

    expect(container.scrollTop).toBe(80);
    expect(container.clientHeight).toBe(0);
  });
});
