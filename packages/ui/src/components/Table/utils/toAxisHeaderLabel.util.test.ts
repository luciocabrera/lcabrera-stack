import { formatDate } from '@lcabrera/utils/formatters/format-date.util';
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

  it('renders a Date with the date-cell formatter rather than a blank header', () => {
    const value = new Date('2026-03-15T00:00:00.000Z');

    expect(toAxisHeaderLabel(value)).toBe(formatDate({ value }));
    expect(toAxisHeaderLabel(value)).not.toBe('');
  });
});
