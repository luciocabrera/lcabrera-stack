import { describe, expect, it } from 'vite-plus/test';

import { toLockedFiltersHeading } from './toLockedFiltersHeading.util';

describe('toLockedFiltersHeading', () => {
  it('joins one entry per restriction, in the order given', () => {
    expect(
      toLockedFiltersHeading({
        entries: [
          { columnKey: 'region', label: 'Region', value: 'North' },
          { columnKey: 'segment', label: 'Segment', value: 'Retail' },
          { columnKey: 'tier', label: 'Tier', value: 'Gold' },
        ],
      }),
    ).toBe('Region: North · Segment: Retail · Tier: Gold');
  });

  it('answers undefined when the table declares no restriction', () => {
    expect(toLockedFiltersHeading(undefined)).toBeUndefined();
  });

  it('answers undefined for a restriction that could not be read', () => {
    expect(
      toLockedFiltersHeading({ entries: [], refusal: 'Unreadable link.' }),
    ).toBeUndefined();
  });
});
