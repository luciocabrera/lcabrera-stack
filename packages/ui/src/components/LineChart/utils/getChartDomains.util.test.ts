import { describe, expect, it } from 'vite-plus/test';

import { getChartDomains } from './getChartDomains.util';

const INVALID_DATE = new Date(Number('NaN'));

const GAP: null = JSON.parse('null');

describe('getChartDomains', () => {
  it('spans every point, band and marker', () => {
    expect(
      getChartDomains({
        markers: [{ label: 'Late', x: 9 }],
        series: [
          {
            band: [{ lower: -4, upper: 12, x: -1 }],
            id: 'a',
            label: 'A',
            points: [
              { x: 0, y: 2 },
              { x: 3, y: GAP },
              { x: 5, y: 8 },
            ],
          },
        ],
      }),
    ).toEqual({ isTime: false, x: [-1, 9], y: [-4, 12] });
  });

  it('reads a series without a band from its points alone', () => {
    expect(
      getChartDomains({
        markers: [],
        series: [{ id: 'a', label: 'A', points: [{ x: 2, y: 3 }] }],
      }),
    ).toEqual({ isTime: false, x: [2, 2], y: [3, 3] });
  });

  it('skips a position that is not finite', () => {
    expect(
      getChartDomains({
        markers: [{ label: 'Lost', x: INVALID_DATE }],
        series: [
          {
            id: 'a',
            label: 'A',
            points: [
              { x: Number('NaN'), y: 1 },
              { x: 4, y: 2 },
            ],
          },
        ],
      }),
    ).toEqual({ isTime: false, x: [4, 4], y: [1, 2] });
  });

  it('reports a time axis when the positions are dates', () => {
    expect(
      getChartDomains({
        markers: [],
        series: [{ id: 'a', label: 'A', points: [{ x: new Date(10), y: 1 }] }],
      }),
    ).toEqual({ isTime: true, x: [10, 10], y: [1, 1] });
  });

  it('takes the domains it is given, a date domain as times', () => {
    expect(
      getChartDomains({
        markers: [],
        series: [{ id: 'a', label: 'A', points: [{ x: 4, y: 2 }] }],
        xDomain: [new Date(1), new Date(9)],
        yDomain: [0, 10],
      }),
    ).toEqual({ isTime: true, x: [1, 9], y: [0, 10] });
  });

  it('has no domain without a finite value', () => {
    expect(getChartDomains({ markers: [], series: [] })).toEqual({
      isTime: false,
      x: undefined,
      y: undefined,
    });
  });
});
