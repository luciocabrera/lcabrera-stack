import { describe, expect, it } from 'vite-plus/test';

import { toAxisHeaderLabel } from './toAxisHeaderLabel.util';

describe('toAxisHeaderLabel', () => {
  it('renders a string value as itself', () => {
    expect(toAxisHeaderLabel('Pending')).toBe('Pending');
  });

  it('renders SQL NULL as an empty header', () => {
    expect(toAxisHeaderLabel(undefined)).toBe('');
  });

  it('renders a driver null as an empty header', () => {
    expect(toAxisHeaderLabel(JSON.parse('null'))).toBe('');
  });

  it('renders a number as decimal text', () => {
    expect(toAxisHeaderLabel(2022)).toBe('2022');
  });
});
