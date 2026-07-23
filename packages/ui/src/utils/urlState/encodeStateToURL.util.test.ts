import { describe, expect, it } from 'vite-plus/test';

import { encodeStateToURL } from './encodeStateToURL.util';

describe('encodeStateToURL', () => {
  it('encodes a simple state object', () => {
    const result = encodeStateToURL({ name: 'asc' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces URL-safe output (no +, /, =)', () => {
    const result = encodeStateToURL({
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    });
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });

  it('converts Set values to arrays for serialization', () => {
    const state = { columnVisibility: new Set(['id', 'name']) };
    const result = encodeStateToURL(state);
    expect(typeof result).toBe('string');
    // Should not throw and should be decodable
    const decoded = JSON.parse(
      atob(
        result
          .replaceAll('-', '+')
          .replaceAll('_', '/')
          .padEnd(result.length + ((4 - (result.length % 4)) % 4), '='),
      ),
    ) as Record<string, unknown>;
    expect(Array.isArray(decoded.columnVisibility)).toBe(true);
  });

  it('encodes empty object', () => {
    const result = encodeStateToURL({});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
