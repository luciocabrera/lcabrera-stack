import { describe, expect, it } from 'vite-plus/test';

import { formatUtcTime } from './formatUtcTime.util';

describe('formatUtcTime', () => {
  it.each([
    { expected: '', iso: '2026-11-02T00:00:00.000Z' },
    { expected: '00:30', iso: '2026-11-02T00:30:00.000Z' },
    { expected: '09:00', iso: '2026-11-02T09:00:00.000Z' },
    { expected: '09:30', iso: '2026-11-02T09:30:00.000Z' },
    { expected: '00:00:15', iso: '2026-11-02T00:00:15.000Z' },
    { expected: '09:30:15', iso: '2026-11-02T09:30:15.000Z' },
    { expected: '09:30:00.250', iso: '2026-11-02T09:30:00.250Z' },
  ])('writes $iso as "$expected"', ({ expected, iso }) => {
    expect(formatUtcTime(new Date(iso))).toBe(expected);
  });
});
