import { describe, expect, it } from 'vite-plus/test';

import { inSequence } from './inSequence.util.ts';

const sleep = async (delay: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, delay);
  });

describe('inSequence', () => {
  it('starts each step only after the previous one settles, keeping the order', async () => {
    const events: string[] = [];
    const results = await inSequence({
      items: [20, 0, 10],
      step: async (delay) => {
        events.push(`start ${String(delay)}`);
        await sleep(delay);
        events.push(`end ${String(delay)}`);

        return delay * 2;
      },
    });

    expect(events).toEqual([
      'start 20',
      'end 20',
      'start 0',
      'end 0',
      'start 10',
      'end 10',
    ]);
    expect(results).toEqual([40, 0, 20]);
  });
});
