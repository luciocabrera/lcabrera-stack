import { describe, expect, it } from 'vite-plus/test';

import { toChartChoiceSections } from './toChartChoiceSections.util';

describe('toChartChoiceSections', () => {
  it('offers density alone when a chart seeds nothing else', () => {
    expect(
      toChartChoiceSections({ density: 'dense' }).map(({ key, value }) => [
        key,
        value,
      ]),
    ).toEqual([['density', 'dense']]);
  });

  it('offers each seeded choice, titled, with its value as a string', () => {
    expect(
      toChartChoiceSections({
        axisLabelStep: 2,
        density: 'compact',
        points: 'auto',
        tickCount: 5,
      }).map(({ key, title, value }) => [key, title, value]),
    ).toEqual([
      ['density', 'Density', 'compact'],
      ['points', 'Points', 'auto'],
      ['axisLabelStep', 'Column labels', '2'],
      ['tickCount', 'Axis ticks', '5'],
    ]);
  });

  it('offers each choice with its labelled options', () => {
    expect(
      toChartChoiceSections({
        axisLabelStep: 1,
        density: 'compact',
        points: 'auto',
        tickCount: 5,
      }).map(({ key, options }) => [
        key,
        options.map(({ label, value }) => `${label}=${value}`),
      ]),
    ).toEqual([
      [
        'density',
        [
          'Dense=dense',
          'Compact=compact',
          'Comfortable=comfortable',
          'Spacious=spacious',
        ],
      ],
      [
        'points',
        ['Automatic=auto', 'Every point=always', 'Linked points only=never'],
      ],
      [
        'axisLabelStep',
        ['Every label=1', 'Every 2nd label=2', 'Every 5th label=5'],
      ],
      ['tickCount', ['Few=3', 'Standard=5', 'Many=8']],
    ]);
  });
});
