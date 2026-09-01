import { describe, expect, it } from 'vite-plus/test';

import { toWideAlltypes150Row } from './toWideAlltypes150Row.util';

const driverRow = {
  c_001: 1,
  c_002: '2',
  c_006: false,
  c_009: new Date('2020-01-01T23:00:00.000Z'),
  c_010: '00:00:01',
  c_014: { g: 1, i: 14, k: 'row-1' },
  c_015: new Uint8Array([0x3a, 0xb7, 0xc9]),
  c_016: '10.0.0.2',
  c_017: { minutes: 1 },
  c_018: { x: 0.1, y: 0.3 },
  c_019: [1, 19, 26],
  id: '1',
};

describe('toWideAlltypes150Row', () => {
  it('renders every value class the way the JSON endpoint did', () => {
    expect(toWideAlltypes150Row(driverRow)).toStrictEqual({
      c_001: 1,
      c_002: '2',
      c_006: false,
      c_009: '"2020-01-01T23:00:00.000Z"',
      c_010: '00:00:01',
      c_014: '{"g":1,"i":14,"k":"row-1"}',
      c_015: '3ab7c9',
      c_016: '10.0.0.2',
      c_017: '{"minutes":1}',
      c_018: '{"x":0.1,"y":0.3}',
      c_019: [1, 19, 26],
      id: '1',
    });
  });

  it('keeps every column of the row it was given', () => {
    expect(
      Object.keys(toWideAlltypes150Row(driverRow)).toSorted((a, b) =>
        a.localeCompare(b),
      ),
    ).toStrictEqual(
      Object.keys(driverRow).toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('does not mutate the row it was given', () => {
    toWideAlltypes150Row(driverRow);

    expect(driverRow.c_009).toBeInstanceOf(Date);
    expect(driverRow.c_015).toBeInstanceOf(Uint8Array);
  });
});
