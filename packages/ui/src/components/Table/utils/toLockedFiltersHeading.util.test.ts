import { describe, expect, it } from 'vite-plus/test';

import { toLockedFiltersHeading } from './toLockedFiltersHeading.util';

describe('toLockedFiltersHeading', () => {
  it('joins one entry per restriction, in the order given', () => {
    expect(
      toLockedFiltersHeading({
        entries: [
          { columnKey: 'category', label: 'Category', value: 'Automotive' },
          { columnKey: 'subcategory', label: 'Subcategory', value: 'Exterior' },
          {
            columnKey: 'customer_type',
            label: 'Customer Type',
            value: 'Business',
          },
        ],
      }),
    ).toBe(
      'Category: Automotive · Subcategory: Exterior · Customer Type: Business',
    );
  });

  it('answers undefined when the table declares no restriction', () => {
    expect(toLockedFiltersHeading(undefined)).toBeUndefined();
  });

  it('answers undefined for a restriction that could not be read', () => {
    // A caller falls back to its own title rather than heading the view with an
    // empty line. What the restriction was is said in the panel, not here.
    expect(
      toLockedFiltersHeading({ entries: [], refusal: 'Unreadable link.' }),
    ).toBeUndefined();
  });
});
