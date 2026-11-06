import { describe, expect, it } from 'vite-plus/test';

import { getCellFill } from './getCellFill.util';

const SEQUENTIAL = { domain: [0, 200], kind: 'sequential' } as const;
const TONE = { kind: 'tone' } as const;
const CELL = { column: 'c', label: 'Cell', row: 'r' };

describe('getCellFill', () => {
  it('is empty for a missing cell under either scale', () => {
    expect(getCellFill({ cell: undefined, scale: TONE })).toEqual({
      kind: 'empty',
    });
    expect(getCellFill({ cell: undefined, scale: SEQUENTIAL })).toEqual({
      kind: 'empty',
    });
  });

  it('takes the tone of the cell under the tone scale and ignores its value', () => {
    expect(
      getCellFill({ cell: { ...CELL, tone: 'error', value: 50 }, scale: TONE }),
    ).toEqual({ kind: 'tone', tone: 'error' });
  });

  it('reads no scale as the tone scale', () => {
    expect(
      getCellFill({
        cell: { ...CELL, tone: 'info', value: 50 },
        scale: undefined,
      }),
    ).toEqual({ kind: 'tone', tone: 'info' });
  });

  it('falls back to the neutral tone for a cell without one', () => {
    expect(getCellFill({ cell: CELL, scale: TONE })).toEqual({
      kind: 'tone',
      tone: 'neutral',
    });
  });

  it.each([
    { percent: '0%', value: 0 },
    { percent: '25%', value: 50 },
    { percent: '100%', value: 200 },
    { percent: '0%', value: -10 },
    { percent: '100%', value: 900 },
  ])('maps $value onto $percent of the domain', ({ percent, value }) => {
    expect(
      getCellFill({ cell: { ...CELL, value }, scale: SEQUENTIAL }),
    ).toEqual({ kind: 'sequential', percent });
  });

  it('prefers the value over the tone under a sequential scale', () => {
    expect(
      getCellFill({
        cell: { ...CELL, tone: 'error', value: 100 },
        scale: SEQUENTIAL,
      }),
    ).toEqual({ kind: 'sequential', percent: '50%' });
  });

  it.each([
    { value: undefined },
    { value: Number('NaN') },
    { value: Number('Infinity') },
  ])(
    'uses the tone under a sequential scale when the value is $value',
    ({ value }) => {
      expect(
        getCellFill({
          cell: { ...CELL, tone: 'warning', value },
          scale: SEQUENTIAL,
        }),
      ).toEqual({ kind: 'tone', tone: 'warning' });
    },
  );
});
