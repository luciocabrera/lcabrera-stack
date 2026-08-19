import { describe, expect, it } from 'vite-plus/test';

import { toGroupLabel } from './to-group-label.util';

describe('toGroupLabel', () => {
  it('passes a text key through unchanged', () => {
    expect(toGroupLabel('Shipped')).toBe('Shipped');
  });

  it('keeps an empty string, which is a value and not a missing one', () => {
    expect(toGroupLabel('')).toBe('');
  });

  it('renders numeric and boolean keys', () => {
    expect(toGroupLabel(7)).toBe('7');
    expect(toGroupLabel(0)).toBe('0');
    expect(toGroupLabel(true)).toBe('true');
    expect(toGroupLabel(false)).toBe('false');
  });

  it('renders a parsed timestamp as ISO', () => {
    expect(toGroupLabel(new Date('2026-08-12T10:30:00.000Z'))).toBe(
      '2026-08-12T10:30:00.000Z',
    );
  });

  it('reads a NULL key as a group rather than a missing one', () => {
    // Parsed rather than written as a literal, because that is how a SQL NULL
    // reaches this function — as the driver's own `null`.
    expect(toGroupLabel(JSON.parse('null'))).toBe('(empty)');
    expect(toGroupLabel(undefined)).toBe('(empty)');
  });

  it('refuses a value outside the dimension vocabulary rather than guessing', () => {
    // `String({})` is `[object Object]`, which reads as a group name and is not
    // one — the whole reason this is a lookup rather than a coercion.
    expect(toGroupLabel({ nested: true })).toBe('(empty)');
    expect(toGroupLabel([1, 2])).toBe('(empty)');
  });
});
