import { describe, expect, it } from 'vite-plus/test';

import { getDraftedText } from './getDraftedText.util';

describe('getDraftedText', () => {
  it('carries a text filter value across', () => {
    expect(
      getDraftedText({ operator: 'equals', type: 'text', value: 'alpha' }),
    ).toBe('alpha');
  });

  it('carries a single-select value across', () => {
    expect(getDraftedText({ type: 'select', value: 'beta' })).toBe('beta');
  });

  it('carries the first multi-select value across', () => {
    expect(
      getDraftedText({ type: 'multiSelect', values: ['gamma', 'delta'] }),
    ).toBe('gamma');
  });

  it('returns empty for a select filter with no chosen option', () => {
    expect(getDraftedText({ type: 'multiSelect', values: [] })).toBe('');
  });

  it('returns empty when there is no filter', () => {
    expect(getDraftedText()).toBe('');
  });

  it('returns empty for filter types that hold no text', () => {
    expect(
      getDraftedText({ operator: 'equals', type: 'number', value: 5 }),
    ).toBe('');
    expect(
      getDraftedText({ operator: 'after', type: 'date', value: '2026-01-01' }),
    ).toBe('');
    expect(getDraftedText({ type: 'boolean', value: true })).toBe('');
  });
});
