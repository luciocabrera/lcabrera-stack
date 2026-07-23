import { describe, expect, it } from 'vite-plus/test';

import { HttpError } from '../errors/httpError.js';
import { resolveSortRules } from './resolveSortRules.util.js';

describe('resolveSortRules', () => {
  it('maps the SortRule columnKey shape to QuerySort column', () => {
    const result = resolveSortRules({
      fallbackSorting: [{ columnKey: 'id', direction: 'asc' }],
      sorting: [
        { columnKey: 'name', direction: 'desc' },
        { columnKey: 'created_at', direction: 'asc' },
      ],
    });

    expect(result).toEqual([
      { column: 'name', direction: 'desc' },
      { column: 'created_at', direction: 'asc' },
    ]);
  });

  it('applies the fallback when the request carries no sort', () => {
    const result = resolveSortRules({
      fallbackSorting: [{ columnKey: 'car_id', direction: 'asc' }],
      sorting: [],
    });

    expect(result).toEqual([{ column: 'car_id', direction: 'asc' }]);
  });

  it('throws a 500 when neither the request nor the fallback yields a sort', () => {
    expect(() =>
      resolveSortRules({ fallbackSorting: [], sorting: [] }),
    ).toThrow(HttpError);
  });
});
