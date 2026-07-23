import { describe, expect, it } from 'vite-plus/test';

import { resolveVirtualSelectOptions } from './resolveVirtualSelectOptions.util';

describe('resolveVirtualSelectOptions', () => {
  it('normalizes string options to label/value pairs', () => {
    const result = resolveVirtualSelectOptions({
      options: ['apple', 'banana'],
      selected: ['apple'],
    });

    expect(result.optionEntries).toEqual([
      { label: 'apple', value: 'apple' },
      { label: 'banana', value: 'banana' },
    ]);
    expect(result.selectedLabels).toEqual(['apple']);
  });

  it('preserves label/value pairs and exposes lookup helpers', () => {
    const result = resolveVirtualSelectOptions({
      options: [
        { label: 'Apple', value: 'a' },
        { label: 'Banana', value: 'b' },
      ],
      selected: ['b'],
    });

    expect(result.selectedLabels).toEqual(['Banana']);
    expect(result.getLabelFromValue('a')).toBe('Apple');
    expect(result.getValueFromLabel('Banana')).toBe('b');
  });

  it('falls back to raw value/label when lookup misses', () => {
    const result = resolveVirtualSelectOptions({
      options: [{ label: 'Apple', value: 'a' }],
      selected: ['unknown'],
    });

    expect(result.selectedLabels).toEqual(['unknown']);
    expect(result.getValueFromLabel('missing')).toBe('missing');
  });
});
