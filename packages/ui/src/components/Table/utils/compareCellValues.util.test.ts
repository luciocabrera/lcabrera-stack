import { describe, expect, it } from 'vite-plus/test';

import { compareCellValues } from './compareCellValues.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('compareCellValues', () => {
  it('orders numbers by value, not by their text', () => {
    expect(compareCellValues({ left: 9, right: 10 })).toBeLessThan(0);
    expect(compareCellValues({ left: 10, right: 9 })).toBeGreaterThan(0);
    expect(compareCellValues({ left: 3, right: 3 })).toBe(0);
  });

  it('orders strings alphabetically', () => {
    expect(compareCellValues({ left: 'Alpha', right: 'Beta' })).toBeLessThan(0);
  });

  it('orders booleans false before true', () => {
    expect(compareCellValues({ left: false, right: true })).toBeLessThan(0);
  });

  it('orders dates by time', () => {
    expect(
      compareCellValues({
        left: new Date('2024-01-02'),
        right: new Date('2024-01-01'),
      }),
    ).toBeGreaterThan(0);
  });

  it('places a missing value after a present one', () => {
    expect(compareCellValues({ left: JSON_NULL, right: 1 })).toBeGreaterThan(0);
    expect(compareCellValues({ left: 'a', right: undefined })).toBeLessThan(0);
    expect(compareCellValues({ left: JSON_NULL, right: undefined })).toBe(0);
  });

  it('orders an empty string as a value, before other text, as Postgres does', () => {
    expect(compareCellValues({ left: '', right: JSON_NULL })).toBeLessThan(0);
    expect(compareCellValues({ left: '', right: 'a' })).toBeLessThan(0);
  });

  it('orders NaN after every other number and level with another NaN', () => {
    expect(compareCellValues({ left: NaN, right: 5 })).toBeGreaterThan(0);
    expect(compareCellValues({ left: 5, right: NaN })).toBeLessThan(0);
    expect(compareCellValues({ left: NaN, right: NaN })).toBe(0);
  });

  it('compares objects through their JSON text', () => {
    expect(compareCellValues({ left: { a: 1 }, right: { a: 2 } })).toBeLessThan(
      0,
    );
  });
});
