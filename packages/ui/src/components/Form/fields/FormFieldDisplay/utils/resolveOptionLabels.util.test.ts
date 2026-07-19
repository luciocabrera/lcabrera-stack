import { describe, expect, it } from 'vitest';

import { resolveOptionLabels } from './resolveOptionLabels.util';

const options = [
  { label: 'Standard', value: 'standard' },
  { label: 'Express', value: 'express' },
  { label: 'Overnight', value: 'overnight' },
] as const;

describe('resolveOptionLabels', () => {
  it('maps a single value to its option label', () => {
    expect(resolveOptionLabels({ options, value: 'express' })).toBe('Express');
  });

  it('joins multiple values (multi-select) with a comma', () => {
    expect(
      resolveOptionLabels({ options, value: ['standard', 'overnight'] }),
    ).toBe('Standard, Overnight');
  });

  it('falls back to the raw value when no option matches', () => {
    expect(resolveOptionLabels({ options, value: 'unknown' })).toBe('unknown');
  });

  it('returns an empty string for an empty or undefined value', () => {
    expect(resolveOptionLabels({ options, value: '' })).toBe('');
    expect(resolveOptionLabels({ options, value: undefined })).toBe('');
  });

  it('returns an empty string for an empty multi-select array', () => {
    expect(resolveOptionLabels({ options, value: [] })).toBe('');
  });
});
