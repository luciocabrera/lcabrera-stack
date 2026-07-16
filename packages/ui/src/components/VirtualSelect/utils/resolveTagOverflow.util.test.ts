import { describe, expect, it } from 'vitest';

import { resolveTagOverflow } from './resolveTagOverflow.util';

describe('resolveTagOverflow', () => {
  it('shows every label and no overflow in single mode', () => {
    const result = resolveTagOverflow({
      mode: 'single',
      selectedLabels: ['Alpha'],
      visibleTagCount: 0,
    });

    expect(result).toEqual({ overflowCount: 0, visibleTags: ['Alpha'] });
  });

  it('shows every label when nothing is selected in multi mode', () => {
    const result = resolveTagOverflow({
      mode: 'multi',
      selectedLabels: [],
      visibleTagCount: 3,
    });

    expect(result).toEqual({ overflowCount: 0, visibleTags: [] });
  });

  it('limits multi-mode tags to the measured count and reports the overflow', () => {
    const result = resolveTagOverflow({
      mode: 'multi',
      selectedLabels: ['Alpha', 'Bravo', 'Charlie'],
      visibleTagCount: 1,
    });

    expect(result).toEqual({
      overflowCount: 2,
      visibleTags: ['Alpha'],
    });
  });

  it('reports zero overflow when every multi-mode tag fits', () => {
    const result = resolveTagOverflow({
      mode: 'multi',
      selectedLabels: ['Alpha', 'Bravo'],
      visibleTagCount: 2,
    });

    expect(result).toEqual({
      overflowCount: 0,
      visibleTags: ['Alpha', 'Bravo'],
    });
  });
});
