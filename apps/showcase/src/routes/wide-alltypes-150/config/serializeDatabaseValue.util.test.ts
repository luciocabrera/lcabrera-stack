import { describe, expect, it } from 'vite-plus/test';

import { serializeDatabaseValue } from './serializeDatabaseValue.util';

describe('serializeDatabaseValue', () => {
  it('renders a bytea value as hex', () => {
    expect(
      serializeDatabaseValue(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f])),
    ).toBe('68656c6c6f');
  });

  it('renders jsonb, interval and point as JSON text', () => {
    expect(serializeDatabaseValue({ g: 1, i: 14, k: 'row-1' })).toBe(
      '{"g":1,"i":14,"k":"row-1"}',
    );
    expect(serializeDatabaseValue({ minutes: 1 })).toBe('{"minutes":1}');
    expect(serializeDatabaseValue({ x: 0.1, y: 0.3 })).toBe(
      '{"x":0.1,"y":0.3}',
    );
  });

  it('renders a date column as a quoted JSON string, as this table always has', () => {
    // Deliberately preserved rather than corrected: this is what every page of
    // this grid has displayed for its date/timestamp columns. See the util's
    // header and the route's ARCHITECTURE.md.
    expect(serializeDatabaseValue(new Date('2020-01-01T23:00:00.000Z'))).toBe(
      '"2020-01-01T23:00:00.000Z"',
    );
  });

  it('leaves an integer[] value as a real array', () => {
    expect(serializeDatabaseValue([1, 19, 26])).toStrictEqual([1, 19, 26]);
  });

  it('leaves primitives and a NULL column alone', () => {
    expect(serializeDatabaseValue('vchar_7_1')).toBe('vchar_7_1');
    expect(serializeDatabaseValue(12)).toBe(12);
    expect(serializeDatabaseValue(false)).toBe(false);
    // Parsed rather than written as a literal: a NULL column is what the driver
    // hands back for every nullable column of this table, and it must not fall
    // into the `typeof value === 'object'` branch and become the string
    // `"null"`.
    expect(serializeDatabaseValue(JSON.parse('null'))).toBeNull();
  });
});
