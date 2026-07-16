import { describe, expect, it } from 'vitest';

import { resolveToggleOptionFilter } from './resolveToggleOptionFilter.util';

describe('resolveToggleOptionFilter', () => {
  it('adds an unselected option to the selection', () => {
    expect(
      resolveToggleOptionFilter({ option: 'b', selectedValues: ['a'] }),
    ).toEqual({ type: 'select', values: ['a', 'b'] });
  });

  it('removes an already selected option', () => {
    expect(
      resolveToggleOptionFilter({ option: 'a', selectedValues: ['a', 'b'] }),
    ).toEqual({ type: 'select', values: ['b'] });
  });

  it('does not mutate the incoming selection', () => {
    const selectedValues = ['a'];

    resolveToggleOptionFilter({ option: 'b', selectedValues });

    expect(selectedValues).toEqual(['a']);
  });
});
