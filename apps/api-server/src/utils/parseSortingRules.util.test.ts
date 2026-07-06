import { HttpError } from 'api-shared';
import { describe, expect, it } from 'vitest';

import { parseSortingRules } from './parseSortingRules.util';

describe('parseSortingRules', () => {
  const args = {
    allowedColumns: new Set(['created_at', 'id']),
    invalidSortMessage: 'Invalid sort payload.',
    unsupportedSortColumnMessage: (columnKey: string) =>
      `Unsupported sort column: ${columnKey}`,
  };

  it('returns an empty array when the query value is missing', () => {
    expect(
      parseSortingRules({
        ...args,
        value: undefined,
      }),
    ).toEqual([]);
  });

  it('parses valid sorting rules', () => {
    expect(
      parseSortingRules({
        ...args,
        value: JSON.stringify([
          { columnKey: 'created_at', direction: 'desc' },
          { columnKey: 'id', direction: 'asc' },
        ]),
      }),
    ).toEqual([
      { columnKey: 'created_at', direction: 'desc' },
      { columnKey: 'id', direction: 'asc' },
    ]);
  });

  it('throws when the parsed payload does not match the sorting schema', () => {
    expect(() =>
      parseSortingRules({
        ...args,
        value: JSON.stringify([{ columnKey: 'created_at', direction: 'down' }]),
      }),
    ).toThrowError(
      expect.objectContaining({
        message: 'Invalid sort payload.',
      }),
    );
  });

  it('throws when a sort rule targets an unsupported column', () => {
    expect(() =>
      parseSortingRules({
        ...args,
        value: JSON.stringify([{ columnKey: 'status', direction: 'asc' }]),
      }),
    ).toThrow(HttpError);
  });
});
