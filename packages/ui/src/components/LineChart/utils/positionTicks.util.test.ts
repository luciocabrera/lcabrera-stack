import { describe, expect, it } from 'vite-plus/test';

import { positionTicks } from './positionTicks.util';

describe('positionTicks', () => {
  it('places each tick by its scaled position and formats its text', () => {
    expect(
      positionTicks({
        format: (value: number) => `${String(value)} ms`,
        scale: (value: number) => value / 3,
        ticks: [0, 100, 200],
      }),
    ).toEqual([
      { at: 0, key: '0', text: '0 ms' },
      { at: 33.33, key: '100', text: '100 ms' },
      { at: 66.67, key: '200', text: '200 ms' },
    ]);
  });

  it('keys a date tick by its time and drops a tick outside the plot', () => {
    expect(
      positionTicks({
        format: () => 'day',
        scale: (value: Date) => value.getTime(),
        ticks: [new Date(50), new Date(150)],
      }),
    ).toEqual([{ at: 50, key: '50', text: 'day' }]);
  });
});
