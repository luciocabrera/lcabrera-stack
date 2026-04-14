import { describe, expect, it } from 'vitest';

import { serializeDatabaseValue } from './serializeDatabaseValue.util.js';

describe('serializeDatabaseValue', () => {
  it('serializes buffers to hex strings', () => {
    expect(serializeDatabaseValue(Buffer.from('hello'))).toBe('68656c6c6f');
  });

  it('serializes plain objects to JSON strings', () => {
    expect(
      serializeDatabaseValue({
        id: 1,
        name: 'Acme',
      }),
    ).toBe('{"id":1,"name":"Acme"}');
  });

  it('returns arrays and primitive values unchanged', () => {
    expect(serializeDatabaseValue(['a', 'b'])).toEqual(['a', 'b']);
    expect(serializeDatabaseValue('paid')).toBe('paid');
    expect(serializeDatabaseValue(12)).toBe(12);
  });
});
