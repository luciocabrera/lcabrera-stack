import { describe, expect, it } from 'vitest';

import { serializeFilter } from './serializeFilter.util';

describe('serializeFilter', () => {
  it('dispatches boolean filter', () => {
    expect(serializeFilter({ filter: { type: 'boolean', value: true } })).toBe(
      true,
    );
  });

  it('dispatches date filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'after', type: 'date', value: '2024-01-15' },
      }),
    ).toEqual(['af', '2024-01-15']);
  });

  it('dispatches select filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'select', values: ['A'] },
      }),
    ).toEqual(['A']);
  });

  it('dispatches multiSelect filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'multiSelect', values: ['A'] },
      }),
    ).toEqual(['A']);
  });

  it('dispatches number filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'number', value: 1 },
      }),
    ).toEqual(['eq', 1]);
  });

  it('dispatches text filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'contains', type: 'text', value: 'hi' },
      }),
    ).toEqual(['ct', 'hi']);
  });
});

describe('serializeFilter', () => {
  it('dispatches boolean filter', () => {
    expect(serializeFilter({ filter: { type: 'boolean', value: true } })).toBe(
      true,
    );
  });

  it('dispatches date filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'after', type: 'date', value: '2024-01-15' },
      }),
    ).toEqual(['af', '2024-01-15']);
  });

  it('dispatches select filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'select', values: ['A'] },
      }),
    ).toEqual(['A']);
  });

  it('dispatches multiSelect filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'multiSelect', values: ['A'] },
      }),
    ).toEqual(['A']);
  });

  it('dispatches number filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'equals', type: 'number', value: 1 },
      }),
    ).toEqual(['eq', 1]);
  });

  it('dispatches text filter', () => {
    expect(
      serializeFilter({
        filter: { operator: 'contains', type: 'text', value: 'hi' },
      }),
    ).toEqual(['ct', 'hi']);
  });
});
