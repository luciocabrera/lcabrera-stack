import { describe, expect, it } from 'vitest';

import { applySearchParamUpdates } from './applySearchParamUpdates.util';

describe('applySearchParamUpdates', () => {
  it('reports a change and sets the new value when a param value differs', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1&sort=asc'),
      updates: [{ key: 'sort', value: 'desc' }],
    });

    expect(changed).toBe(true);
    expect(searchParams.toString()).toBe('page=1&sort=desc');
  });

  it('reports no change when the update matches the current value', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1&sort=asc'),
      updates: [{ key: 'sort', value: 'asc' }],
    });

    expect(changed).toBe(false);
    expect(searchParams.toString()).toBe('page=1&sort=asc');
  });

  it('reports a change and deletes an existing param when value is empty', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1&filters=paid'),
      updates: [{ key: 'filters', value: '' }],
    });

    expect(changed).toBe(true);
    expect(searchParams.toString()).toBe('page=1');
  });

  it('reports no change when deleting a param that does not exist', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1'),
      updates: [{ key: 'filters', value: '' }],
    });

    expect(changed).toBe(false);
    expect(searchParams.toString()).toBe('page=1');
  });

  it('ignores updates with an empty key', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1'),
      updates: [{ key: '', value: 'ignored' }],
    });

    expect(changed).toBe(false);
    expect(searchParams.toString()).toBe('page=1');
  });

  it('applies multiple updates in order and reports a change if any differ', () => {
    const { changed, searchParams } = applySearchParamUpdates({
      searchParams: new URLSearchParams('page=1&sort=asc'),
      updates: [
        { key: 'sort', value: 'asc' },
        { key: 'view', value: 'grid' },
      ],
    });

    expect(changed).toBe(true);
    expect(searchParams.toString()).toBe('page=1&sort=asc&view=grid');
  });

  it('does not mutate the input URLSearchParams', () => {
    const input = new URLSearchParams('page=1&sort=asc');

    applySearchParamUpdates({
      searchParams: input,
      updates: [{ key: 'sort', value: 'desc' }],
    });

    expect(input.toString()).toBe('page=1&sort=asc');
  });
});
