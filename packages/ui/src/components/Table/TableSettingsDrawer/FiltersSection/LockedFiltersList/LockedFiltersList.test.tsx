// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableLockedFilters } from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';

import { LockedFiltersList } from './LockedFiltersList.component';

afterEach(cleanup);

const GROUP: TableLockedFilters = {
  entries: [
    { columnKey: 'category', label: 'Category', value: 'Automotive' },
    { columnKey: 'subcategory', label: 'Subcategory', value: 'Exterior' },
    { columnKey: 'customer_type', label: 'Customer Type', value: 'Business' },
  ],
};

const renderIn = (lockedFilters?: TableLockedFilters) => {
  render(
    <TableConfigProvider
      metaState={{ ...(lockedFilters && { lockedFilters }) }}
    >
      <LockedFiltersList />
    </TableConfigProvider>,
  );
};

describe('LockedFiltersList', () => {
  it('lists one entry per restriction, with its column label and value', () => {
    renderIn(GROUP);

    for (const { columnKey, label, value } of GROUP.entries) {
      const entry = screen.getByTestId(`locked-filter-${columnKey}`);

      expect(entry.textContent).toContain(label);
      expect(entry.textContent).toContain(value);
    }
  });

  it('lists them in the order the restriction states, outermost first', () => {
    renderIn(GROUP);

    expect(
      [...screen.getByTestId('locked-filters-list').querySelectorAll('li')].map(
        (entry) => entry.dataset.testid,
      ),
    ).toEqual([
      'locked-filter-category',
      'locked-filter-subcategory',
      'locked-filter-customer_type',
    ]);
  });

  it('offers no control that could remove or edit one', () => {
    // The restriction is what makes this view that group's. A control able to
    // take it off would leave the heading naming a group the rows are not in.
    renderIn(GROUP);

    const section = screen.getByTestId('locked-filters-list');

    expect(within(section).queryAllByRole('button')).toEqual([]);
    expect(within(section).queryAllByRole('textbox')).toEqual([]);
    expect(section.querySelectorAll('input, select, textarea')).toHaveLength(0);
  });

  it('counts separately from the reader-removable filters', () => {
    // `Active Filters (n)` answers "how many can I take off"; an entry no
    // control removes is not one of them, so it gets its own heading and count.
    renderIn(GROUP);

    expect(screen.getByTestId('locked-filters-list').textContent).toContain(
      'Locked Filters (3)',
    );
  });

  it('states why a restriction could not be read instead of listing nothing', () => {
    // An empty list under this heading reads as "nothing restricts these rows",
    // which is the opposite of what a refused token means.
    renderIn({ entries: [], refusal: 'This link does not name a group.' });

    const section = screen.getByTestId('locked-filters-list');

    expect(section.textContent).toContain('This link does not name a group.');
    expect(section.querySelectorAll('li')).toHaveLength(0);
  });

  it('falls back to its own sentence when a refusal carries none', () => {
    renderIn({ entries: [] });

    expect(screen.getByTestId('locked-filters-list').textContent).toContain(
      'These rows are restricted',
    );
  });

  it('renders nothing at all on a table the route declared no restriction for', () => {
    renderIn();

    expect(screen.queryByTestId('locked-filters-list')).toBeNull();
  });
});
