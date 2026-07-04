import { describe, expect, it } from 'vitest';

import { resolveVirtualSelectChange } from './resolveVirtualSelectChange.util';

const identity = (label: string) => label;

describe('resolveVirtualSelectChange', () => {
  it('returns single-mode new value and requests close', () => {
    const result = resolveVirtualSelectChange({
      filter: { type: 'select', values: ['b'] },
      getValueFromLabel: identity,
      mode: 'single',
      selected: [],
    });

    expect(result.nextSelected).toEqual(['b']);
    expect(result.shouldCloseDropdown).toBe(true);
  });

  it('returns empty selection in single mode when no new value provided', () => {
    const result = resolveVirtualSelectChange({
      filter: { type: 'select', values: ['a'] },
      getValueFromLabel: identity,
      mode: 'single',
      selected: ['a'],
    });

    expect(result.nextSelected).toEqual([]);
    expect(result.shouldCloseDropdown).toBe(true);
  });

  it('returns multi-mode selection without closing the dropdown', () => {
    const result = resolveVirtualSelectChange({
      filter: { type: 'multiSelect', values: ['a', 'b'] },
      getValueFromLabel: identity,
      mode: 'multi',
      selected: ['a'],
    });

    expect(result.nextSelected).toEqual(['a', 'b']);
    expect(result.shouldCloseDropdown).toBe(false);
  });

  it('maps display labels back to values via getValueFromLabel', () => {
    const result = resolveVirtualSelectChange({
      filter: { type: 'multiSelect', values: ['Banana'] },
      getValueFromLabel: (label) => (label === 'Banana' ? 'b' : label),
      mode: 'multi',
      selected: [],
    });

    expect(result.nextSelected).toEqual(['b']);
  });
});
