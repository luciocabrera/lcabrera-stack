import { describe, expect, it } from 'vite-plus/test';

import { toChartChoicePatch } from './toChartChoicePatch.util';

describe('toChartChoicePatch', () => {
  it.each([
    {
      args: { key: 'density', value: 'spacious' },
      patch: { density: 'spacious' },
    },
    { args: { key: 'points', value: 'always' }, patch: { points: 'always' } },
    { args: { key: 'axisLabelStep', value: '5' }, patch: { axisLabelStep: 5 } },
    { args: { key: 'tickCount', value: '8' }, patch: { tickCount: 8 } },
  ] as const)('stages $args.key $args.value', ({ args, patch }) => {
    expect(toChartChoicePatch(args)).toEqual(patch);
  });

  it.each([
    { key: 'density', value: 'roomy' },
    { key: 'points', value: 'some' },
    { key: 'tickCount', value: '0' },
    { key: 'tickCount', value: '-2' },
    { key: 'axisLabelStep', value: 'two' },
  ] as const)('stages nothing for %o', (args) => {
    expect(toChartChoicePatch(args)).toEqual({});
  });
});
