import { describe, expect, it } from 'vite-plus/test';

import { getMarkerGeometry } from './getMarkerGeometry.util';

const x = (value: Date | number) => Number(value) * 10;

describe('getMarkerGeometry', () => {
  it('draws a full-height line at each marker, neutral unless toned', () => {
    expect(
      getMarkerGeometry({
        markers: [
          { label: 'Start', x: 1 },
          { label: 'Stop', to: '/stop', tone: 'error', x: 2.5 },
        ],
        x,
      }),
    ).toEqual([
      {
        at: 10,
        d: 'M10,0L10,100',
        key: '0',
        label: 'Start',
        to: undefined,
        tone: 'neutral',
      },
      {
        at: 25,
        d: 'M25,0L25,100',
        key: '1',
        label: 'Stop',
        to: '/stop',
        tone: 'error',
      },
    ]);
  });

  it('drops a marker with no finite position or one outside the plot', () => {
    expect(
      getMarkerGeometry({
        markers: [
          { label: 'Nowhere', x: new Date(NaN) },
          { label: 'Late', x: 11 },
        ],
        x,
      }),
    ).toEqual([]);
  });
});
