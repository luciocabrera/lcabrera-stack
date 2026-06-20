// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  renderStats,
  trackRender,
  trackRenderComplete,
} from './renderTracker.util';

type WindowWithRenderStats = Window & {
  __renderStats?: typeof renderStats;
};

describe('renderTracker.util', () => {
  afterEach(() => {
    renderStats.reset();
    vi.restoreAllMocks();
  });

  it('tracks render counts and render durations per component', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(25)
      .mockReturnValueOnce(60);

    trackRender('OrdersTable');
    trackRender('OrdersTable');
    trackRenderComplete({ componentName: 'OrdersTable', startTime: 50 });

    expect(renderStats.getComponent('OrdersTable')).toMatchObject({
      count: 2,
      renderTimes: expect.any(Array),
      totalTime: 10,
    });
  });

  it('returns a summary and serializable export payload', () => {
    trackRender('OrdersTable');
    trackRender('OrdersTable');
    trackRender('FiltersPanel');

    expect(renderStats.getSummary()).toMatchObject({
      avgRendersPerComponent: 2,
      componentCount: 2,
      totalRenders: 3,
    });

    expect(JSON.parse(renderStats.toJSON())).toMatchObject({
      components: [
        expect.objectContaining({ name: 'OrdersTable', renderCount: 2 }),
        expect.objectContaining({ name: 'FiltersPanel', renderCount: 1 }),
      ],
      summary: {
        avgRendersPerComponent: 2,
        componentCount: 2,
        totalRenders: 3,
      },
    });
  });

  it('copies stats to the clipboard when the clipboard API is available', async () => {
    const clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    trackRender('OrdersTable');

    const json = await renderStats.copy();

    expect(clipboard.writeText).toHaveBeenCalledWith(json);
    expect(logSpy).toHaveBeenCalled();
  });

  it('falls back to console output when clipboard copy fails', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard blocked')),
      },
    });

    trackRender('OrdersTable');

    const json = await renderStats.copy();

    expect(logSpy).toHaveBeenCalledWith('📋 Copy manually:', json);
  });

  it('prints a formatted summary to the console', () => {
    const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
    const groupEndSpy = vi
      .spyOn(console, 'groupEnd')
      .mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => {});

    trackRender('OrdersTable');
    trackRenderComplete({
      componentName: 'OrdersTable',
      startTime: performance.now() - 10,
    });
    trackRender('FiltersPanel');

    renderStats.print();

    expect(groupSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    expect(tableSpy).toHaveBeenCalledTimes(2);
    expect(groupEndSpy).toHaveBeenCalled();
  });

  it('exposes renderStats on window in development', () => {
    expect((globalThis as unknown as WindowWithRenderStats).__renderStats).toBe(
      renderStats,
    );
  });
});
